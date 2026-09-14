import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { isGlobalAdmin } from "@/lib/rbac";
import { SponsorForm } from "@/components/sponsors/SponsorForm";

export default async function NewSponsorPage() {
  const user = await getCurrentUser();
  if (!user || !isGlobalAdmin(user)) redirect("/dashboard");

  return (
    <div>
      <h1 className="text-xl font-semibold text-white">Nuevo sponsor</h1>
      <div className="mt-6">
        <SponsorForm />
      </div>
    </div>
  );
}
