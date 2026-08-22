export function BookingConfirmCard({
  handoff,
}: {
  readonly handoff?: {
    url: string;
    platform: string;
    disclaimer: string;
    quotedAmount: number | null;
    currency: string;
    route: string;
    travelDate?: string;
  };
}) {
  if (!handoff) {
    return null;
  }

  return (
    <section className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
      <h2 className="font-medium text-lg">Confirm before you leave Travel Gennie</h2>
      <p className="mt-2">
        {handoff.route}
        {handoff.travelDate ? ` · ${handoff.travelDate}` : ""}
      </p>
      <p className="mt-1 text-muted-foreground">
        Quoted{" "}
        {handoff.quotedAmount != null
          ? `${handoff.currency} ${Math.round(handoff.quotedAmount)}`
          : "live OTA price"}{" "}
        · cheapest check continues on {handoff.platform}
      </p>
      <p className="mt-2 text-muted-foreground text-xs">{handoff.disclaimer}</p>
      <a
        className="mt-3 inline-flex rounded-md bg-primary px-3 py-2 text-primary-foreground"
        href={handoff.url}
        rel="noreferrer"
        target="_blank"
      >
        Open {handoff.platform}
      </a>
    </section>
  );
}
