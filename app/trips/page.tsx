import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { listTripsForUser } from "@/lib/trips";

export default async function TripsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const trips = await listTripsForUser(userId);

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <h1 className="font-medium text-3xl tracking-tight">Saved trips</h1>
      {trips.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No saved trips yet. Ask Travel Gennie to plan a route, then save it.
        </p>
      ) : (
        <ul className="space-y-3">
          {trips.map((trip) => (
            <li className="rounded-xl border bg-card p-4" key={trip.id}>
              <p className="font-medium">{trip.title}</p>
              <p className="text-muted-foreground text-sm">
                {trip.tripState.originCity} → {trip.tripState.destinationCity} · {trip.status}
              </p>
              <p className="mt-1 text-muted-foreground text-xs">
                Updated {trip.updatedAt.toLocaleString("en-IN")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
