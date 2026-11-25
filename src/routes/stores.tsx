import { createFileRoute } from "@tanstack/react-router";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Panel, Variance } from "@/components/ui-kit";
import { storeLoc } from "@/lib/filters";
import { VARIANCE } from "@/lib/types";

export const Route = createFileRoute("/stores")({
  head: () => ({
    meta: [
      { title: "Store Intelligence · RetailGuard AI" },
      { name: "description", content: "Per-store anomaly counts and net inventory variance." },
      { property: "og:title", content: "Store Intelligence · RetailGuard AI" },
      { property: "og:description", content: "Per-store anomaly counts and net inventory variance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Stores,
});

function Stores() {
  const { cases } = useDashboardData();
  const stores = Object.values(
    cases.reduce<Record<string, { id: string; n: number; flagged: number; high: number; net: number }>>((acc, c) => {
      const s = (acc[c["Store ID"]] ??= { id: c["Store ID"], n: 0, flagged: 0, high: 0, net: 0 });
      s.n++; s.net += c[VARIANCE];
      if (c["Review Priority"] !== "No rule-based alert") s.flagged++;
      if (c["Review Priority"] === "High review priority") s.high++;
      return acc;
    }, {}),
  ).sort((a, b) => b.high - a.high || b.flagged - a.flagged);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {stores.map((s) => (
        <Panel key={s.id} title={s.id} className={s.high ? "border-critical/50 glow-critical" : ""}>
          <p className="text-lg font-medium">{storeLoc(s.id).name}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
            <div><div className="font-mono text-xl">{s.flagged}</div><div className="label-caps">Flagged</div></div>
            <div><div className="font-mono text-xl text-critical">{s.high}</div><div className="label-caps">Critical</div></div>
            <div><div className="text-xl"><Variance v={s.net} /></div><div className="label-caps">Net var.</div></div>
          </div>
        </Panel>
      ))}
    </div>
  );
}
