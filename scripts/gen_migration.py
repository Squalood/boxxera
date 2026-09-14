import re
import sys

SCHEMA_PATH = "prisma/schema.prisma"

with open(SCHEMA_PATH) as f:
    raw = f.read()

# Strip line comments (// ...) but keep the rest of the line
lines = []
for line in raw.split("\n"):
    # remove // comments not inside strings (schema has none with // in strings)
    idx = line.find("//")
    if idx != -1:
        line = line[:idx]
    lines.append(line)
text = "\n".join(lines)

# --- Parse enums -------------------------------------------------------------
enum_pattern = re.compile(r"enum\s+(\w+)\s*\{([^}]*)\}", re.MULTILINE)
enums = {}
for m in enum_pattern.finditer(text):
    name = m.group(1)
    body = m.group(2)
    values = [v.strip() for v in body.split("\n") if v.strip()]
    enums[name] = values

# --- Parse models -------------------------------------------------------------
model_pattern = re.compile(r"model\s+(\w+)\s*\{([^}]*)\}", re.MULTILINE)
models = {}
model_order = []
for m in model_pattern.finditer(text):
    name = m.group(1)
    body = m.group(2)
    model_order.append(name)
    field_lines = [l.strip() for l in body.split("\n") if l.strip()]
    models[name] = field_lines

enum_names = set(enums.keys())
model_names = set(model_order)
SCALAR_TYPES = {"String", "Int", "Float", "Boolean", "DateTime", "Json", "Decimal", "BigInt", "Bytes"}

def parse_field_line(line):
    """Return dict describing a field, or None if it's a @@ block-level attribute."""
    if line.startswith("@@"):
        return {"block": line}
    # tokenize: name type attrs...
    parts = line.split()
    if len(parts) < 2:
        return None
    fname = parts[0]
    ftype = parts[1]
    rest = " ".join(parts[2:])
    return {"name": fname, "type": ftype, "attrs": rest, "raw": line}

# scalar Prisma type -> Postgres type
def sql_type(ftype, attrs):
    base = ftype.rstrip("?").rstrip("[]")
    optional = ftype.endswith("?")
    is_list = ftype.endswith("[]")
    decimal_match = re.search(r"@db\.Decimal\((\d+),\s*(\d+)\)", attrs)
    if decimal_match:
        return f"DECIMAL({decimal_match.group(1)},{decimal_match.group(2)})", optional, is_list
    mapping = {
        "String": "TEXT",
        "Int": "INTEGER",
        "Boolean": "BOOLEAN",
        "DateTime": "TIMESTAMP(3)",
        "Json": "JSONB",
        "Decimal": "DECIMAL(65,30)",
    }
    if base in mapping:
        return mapping[base], optional, is_list
    if base in enum_names:
        return f'"{base}"', optional, is_list
    return None, optional, is_list  # relation object type (not a column) unless it has @relation with fields

def quote_ident(s):
    return f'"{s}"'

sql_statements = []

# 1. Enums
for name, values in enums.items():
    vals = ", ".join(f"'{v}'" for v in values)
    sql_statements.append(f'-- CreateEnum\nCREATE TYPE "{name}" AS ENUM ({vals});')

# We'll collect: table columns, primary key, uniques, foreign keys, indexes
table_defs = {}   # model -> list of column SQL fragments
table_pk = {}     # model -> pk column
table_uniques = {}  # model -> list of (constraint_name, [cols])
table_indexes = {}  # model -> list of (index_name, [cols])
table_fks = {}    # model -> list of (constraint_name, col, ref_table, ref_col)
table_defaults_now = {}

for model in model_order:
    lines_ = models[model]
    cols = []
    pk = None
    uniques = []
    indexes = []
    fks = []
    seen_cols = set()

    for line in lines_:
        parsed = parse_field_line(line)
        if parsed is None:
            continue
        if "block" in parsed:
            b = parsed["block"]
            bm = re.match(r"@@unique\(\[([^\]]+)\]\)", b)
            if bm:
                flds = [x.strip() for x in bm.group(1).split(",")]
                uniques.append(flds)
                continue
            bm2 = re.match(r"@@index\(\[([^\]]+)\]\)", b)
            if bm2:
                flds = [x.strip() for x in bm2.group(1).split(",")]
                indexes.append(flds)
                continue
            continue

        fname = parsed["name"]
        ftype = parsed["type"]
        attrs = parsed["attrs"]

        # Relation field WITHOUT @relation(fields:...) => not a column (back-relation)
        has_relation_fields = "@relation(" in attrs and "fields:" in attrs

        base_type = ftype.rstrip("?").rstrip("[]")
        is_list_type = ftype.endswith("[]")

        is_scalar_or_enum = base_type in SCALAR_TYPES or base_type in enum_names
        is_model_relation = base_type in model_names

        if is_model_relation:
            # It's a relation to another model, not a column by itself.
            continue  # the FK scalar column (e.g. fighterAId) is its own line
        if not is_scalar_or_enum:
            continue  # unknown/unsupported type, skip defensively

        if is_list_type:
            continue  # scalar list not used in this schema

        pg_type, optional, _ = sql_type(ftype, attrs)
        if pg_type is None:
            continue

        col_def_parts = [quote_ident(fname), pg_type]
        if not optional:
            col_def_parts.append("NOT NULL")

        default_match = re.search(r"@default\(((?:[^()]|\([^()]*\))*)\)", attrs)
        if default_match:
            dval = default_match.group(1).strip()
            if dval == "now()":
                col_def_parts.append("DEFAULT CURRENT_TIMESTAMP")
            elif dval in ("autoincrement()", "cuid()", "uuid()"):
                pass  # client-generated or serial, no plain DB default needed here
            elif dval.startswith('"') and dval.endswith('"'):
                # Prisma source uses double quotes for string defaults;
                # SQL string literals need single quotes, or Postgres reads
                # this as a (nonexistent) column reference.
                inner = dval[1:-1].replace("'", "''")
                col_def_parts.append(f"DEFAULT '{inner}'")
            elif dval in ("true", "false"):
                col_def_parts.append(f"DEFAULT {dval}")
            elif re.match(r"^-?\d+(\.\d+)?$", dval):
                col_def_parts.append(f"DEFAULT {dval}")
            else:
                # enum default like DISCOVERED, or PENDING etc.
                col_def_parts.append(f"DEFAULT '{dval}'")

        if "@updatedAt" in attrs:
            pass  # Prisma manages at client level; no DB trigger needed for this migration

        cols.append(" ".join(col_def_parts))
        seen_cols.add(fname)

        if "@id" in attrs:
            pk = fname
        if "@unique" in attrs and "@@unique" not in attrs:
            uniques.append([fname])

    table_defs[model] = cols
    table_pk[model] = pk
    table_uniques[model] = uniques
    table_indexes[model] = indexes

# Now handle foreign keys: re-scan for @relation(fields:[x], references:[y]) referencing model
for model in model_order:
    lines_ = models[model]
    fks = []
    for line in lines_:
        parsed = parse_field_line(line)
        if parsed is None or "block" in parsed:
            continue
        attrs = parsed["attrs"]
        if "@relation(" in attrs and "fields:" in attrs:
            relm = re.search(r"fields:\s*\[([^\]]+)\]", attrs)
            refm = re.search(r"references:\s*\[([^\]]+)\]", attrs)
            # target model = the field's type (strip ? )
            target_model = parsed["type"].rstrip("?")
            if relm and refm and target_model in models:
                fk_col = relm.group(1).strip()
                ref_col = refm.group(1).strip()
                # Optionality of the FK is determined by the scalar column's
                # own declared type (e.g. "commissionId String?"), not this line.
                optional_fk = True
                for l2 in lines_:
                    p2 = parse_field_line(l2)
                    if p2 and "name" in p2 and p2["name"] == fk_col:
                        optional_fk = p2["type"].endswith("?")
                        break
                fks.append((fk_col, target_model, ref_col, optional_fk))
    table_fks[model] = fks

# --- Emit CREATE TABLE statements ---------------------------------------------
for model in model_order:
    cols = table_defs[model]
    pk = table_pk[model]
    col_sql = ",\n    ".join(cols)
    pk_sql = f',\n\n    CONSTRAINT "{model}_pkey" PRIMARY KEY ("{pk}")' if pk else ""
    stmt = f'-- CreateTable\nCREATE TABLE "{model}" (\n    {col_sql}{pk_sql}\n);'
    sql_statements.append(stmt)

# --- Emit unique indexes -------------------------------------------------------
for model in model_order:
    for flds in table_uniques[model]:
        idx_name = f'{model}_{"_".join(flds)}_key'
        cols_sql = ", ".join(f'"{c}"' for c in flds)
        sql_statements.append(f'-- CreateIndex\nCREATE UNIQUE INDEX "{idx_name}" ON "{model}"({cols_sql});')

# --- Emit regular indexes ------------------------------------------------------
for model in model_order:
    for flds in table_indexes[model]:
        idx_name = f'{model}_{"_".join(flds)}_idx'
        cols_sql = ", ".join(f'"{c}"' for c in flds)
        sql_statements.append(f'-- CreateIndex\nCREATE INDEX "{idx_name}" ON "{model}"({cols_sql});')

# --- Emit foreign keys ----------------------------------------------------------
for model in model_order:
    for (fk_col, target_model, ref_col, optional_fk) in table_fks[model]:
        constraint_name = f"{model}_{fk_col}_fkey"
        on_delete = "SET NULL" if optional_fk else "RESTRICT"
        sql_statements.append(
            f'-- AddForeignKey\nALTER TABLE "{model}" ADD CONSTRAINT "{constraint_name}" '
            f'FOREIGN KEY ("{fk_col}") REFERENCES "{target_model}"("{ref_col}") ON DELETE {on_delete} ON UPDATE CASCADE;'
        )

output = "\n\n".join(sql_statements) + "\n"
with open("migration_generated.sql", "w") as f:
    f.write(output)

print(f"Generated {len(model_order)} models, {len(enums)} enums")
print(f"Total statements: {len(sql_statements)}")
