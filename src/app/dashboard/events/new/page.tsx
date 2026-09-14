import { prisma } from "@/lib/prisma";
import { EventForm } from "@/components/events/EventForm";

export default async function NewEventPage() {
  const commissions = await prisma.commission.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <h1 className="text-xl font-semibold text-white">Nuevo evento</h1>
      <div className="mt-6">
        <EventForm commissions={commissions} />
      </div>
    </div>
  );
}
