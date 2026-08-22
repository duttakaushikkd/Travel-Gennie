import type { Itinerary } from "@/lib/trip";

export function ItineraryCanvas({ itinerary }: { readonly itinerary?: Itinerary }) {
  if (!itinerary) {
    return (
      <section className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        The day-by-day itinerary will appear here after Travel Gennie plans the trip.
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="font-medium text-lg">Itinerary</h2>
      {itinerary.days.map((day) => (
        <article className="rounded-xl border bg-card p-4" key={day.title}>
          <h3 className="font-medium">{day.title}</h3>
          <ul className="mt-3 space-y-3">
            {day.items.map((item) => (
              <li className="text-sm" key={`${day.title}-${item.time}-${item.place}`}>
                <p className="font-medium">
                  {item.time} · {item.place}
                </p>
                <p className="text-muted-foreground">{item.why}</p>
                {item.estCost != null ? (
                  <p className="mt-1 text-xs text-muted-foreground">Est. ₹{item.estCost}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </article>
      ))}
      {itinerary.notes ? <p className="text-muted-foreground text-sm">{itinerary.notes}</p> : null}
    </section>
  );
}
