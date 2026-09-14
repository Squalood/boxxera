import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { recalculateFromVotes } from "@/lib/engine/votes";

const VOTER_COOKIE = "boxxera_voter";

/**
 * Public, no-login voting. Anyone can vote once per opportunity — identity is
 * a random anonymous key stored in a cookie, not a user account. This is
 * intentionally lightweight: it measures interest, it does not gate anything
 * sensitive (see engine docs — votes only feed commercialScore, they never
 * approve or convert an opportunity).
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const opportunity = await prisma.fightOpportunity.findUnique({ where: { id: params.id } });
  if (!opportunity) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  // Only opportunities already screened by the matchmaking engine (not raw
  // DISCOVERED ideas) are open to public voting — this is the "curated menu"
  // principle: the public picks among validated options, not blank slates.
  if (!["SUGGESTED", "CONTACTING", "NEGOTIATING"].includes(opportunity.status)) {
    return NextResponse.json({ error: "Esta oportunidad no está abierta a votación" }, { status: 409 });
  }

  let voterKey = req.cookies.get(VOTER_COOKIE)?.value;
  const isNewVoter = !voterKey;
  if (!voterKey) voterKey = randomUUID();

  const body = await req.json().catch(() => ({}));
  const city: string | undefined = body.city;

  try {
    await prisma.opportunityVote.create({
      data: { opportunityId: params.id, voterKey, city: city || null }
    });
  } catch {
    return NextResponse.json({ error: "Ya votaste por esta pelea." }, { status: 409 });
  }

  const result = await recalculateFromVotes(params.id);

  const res = NextResponse.json({ ok: true, voteCount: result?.voteCount ?? 0 });
  if (isNewVoter) {
    res.cookies.set(VOTER_COOKIE, voterKey, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365
    });
  }
  return res;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const voteCount = await prisma.opportunityVote.count({ where: { opportunityId: params.id } });
  const voterKey = req.cookies.get(VOTER_COOKIE)?.value;
  const alreadyVoted = voterKey
    ? !!(await prisma.opportunityVote.findUnique({
        where: { opportunityId_voterKey: { opportunityId: params.id, voterKey } }
      }))
    : false;
  return NextResponse.json({ voteCount, alreadyVoted });
}
