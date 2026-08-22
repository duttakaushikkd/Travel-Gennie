import type { FareComparison } from "@/lib/trip";

export function FareTable({ comparison }: { readonly comparison?: FareComparison }) {
  if (!comparison) {
    return (
      <section className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        Ranked routes and OTA deep links will show here after a fare search.
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-medium text-lg">Route comparison</h2>
        <p className="mt-1 text-muted-foreground text-xs">{comparison.disclaimer}</p>
        <p className="mt-1 text-muted-foreground text-xs">
          Snapshot {new Date(comparison.quotedAt).toLocaleString("en-IN")} · {comparison.cheapestPlatform}
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Route</th>
              <th className="px-3 py-2 font-medium">Carrier</th>
              <th className="px-3 py-2 font-medium">Duration</th>
              <th className="px-3 py-2 font-medium">Stops</th>
              <th className="px-3 py-2 font-medium">Quoted fare</th>
              <th className="px-3 py-2 font-medium">Book</th>
            </tr>
          </thead>
          <tbody>
            {comparison.options.map((option, index) => (
              <tr className="border-t" key={option.id}>
                <td className="px-3 py-2">
                  {option.originIata} → {option.destinationIata}
                  {index === 0 ? (
                    <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs">Best match</span>
                  ) : null}
                </td>
                <td className="px-3 py-2">{option.carrier}</td>
                <td className="px-3 py-2">
                  {option.durationMinutes > 0 ? `${Math.round(option.durationMinutes / 60)}h ${option.durationMinutes % 60}m` : "—"}
                </td>
                <td className="px-3 py-2">{option.stops}</td>
                <td className="px-3 py-2">
                  {option.amount != null ? `₹${Math.round(option.amount)}` : "Check OTA"}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    {option.deepLinks.map((link) => (
                      <a
                        className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
                        href={link.url}
                        key={link.platform}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
