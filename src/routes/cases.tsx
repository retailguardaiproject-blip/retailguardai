import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Panel, PriorityBadge, Variance } from "@/components/ui-kit";
import { VARIANCE } from "@/lib/types";
import { cn } from "@/lib/utils";

const StoreMap = lazy(() => import("@/components/StoreMap"));

export const Route = createFileRoute("/cases")({
  head: () => ({
    meta: [
      { title: "Case Explorer · RetailGuard AI" },
      { name: "description", content: "Search anomaly cases and locate stores on the map." },
      { property: "og:title", content: "Case Explorer · RetailGuard AI" },
      { property: "og:description", content: "Search anomaly cases and locate stores on the map." },
    ],
  }),
  component: Cases,
});

function Cases() {
  const { cases } = useDashboardData();
  const [q, setQ] = useState("");
  const [prio, setPrio] = useState("all");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [sel, setSel] = useState<string | null>(null);
  const rows = cases.filter((c) =>
    (prio === "all" || c["Review Priority"] === prio) &&
    `${c["Case ID"]} ${c["Store ID"]} ${c["Product ID"]} ${c.Category}`.toLowerCase().includes(q.toLowerCase()));
  const selected = cases.find((c) => c["Case ID"] === sel);
  const toggle = (id: string) => setChecked((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(380px,2fr)_3fr]">
      <Panel title={`Case Explorer · ${rows.length}`} action={checked.size ? <span className="text-xs text-primary">{checked.size} selected</span> : null}>
        <div className="mb-3 flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cases, stores, products…"
            className="flex-1 rounded-md border border-input bg-secondary px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          <select value={prio} onChange={(e) => setPrio(e.target.value)} className="rounded-md border border-input bg-secondary px-2 text-sm">
            <option value="all">All priorities</option>
            <option>High review priority</option><option>Review</option><option>No rule-based alert</option>
          </select>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr><th className="w-6 pb-2" /><th className="pb-2 font-medium">Case ID</th><th className="font-medium">Category</th><th className="font-medium">Priority</th><th className="text-right font-medium">Variance</th></tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c["Case ID"]} onClick={() => setSel(c["Case ID"])}
                className={cn("cursor-pointer border-t border-border hover:bg-accent/40", sel === c["Case ID"] && "bg-accent/60")}>
                <td className="py-2" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" aria-label={`Select ${c["Case ID"]}`} checked={checked.has(c["Case ID"])} onChange={() => toggle(c["Case ID"])} className="accent-primary" />
                </td>
                <td className="font-mono text-primary">{c["Case ID"]}</td>
                <td>{c.Category}</td>
                <td><PriorityBadge p={c["Review Priority"]} /></td>
                <td className="text-right"><Variance v={c[VARIANCE]} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {selected && (
          <div className="mt-4 rounded-md border border-primary/50 p-3 text-sm">
            <p className="label-caps mb-1">Evidence</p>
            <p>{selected["Evidence / Explanation"]}</p>
          </div>
        )}
      </Panel>
      <Panel className="p-1">
        <ClientOnly fallback={<div className="min-h-[560px]" />}>
          <Suspense fallback={<div className="min-h-[560px]" />}>
            <StoreMap cases={rows} selected={selected} onSelect={setSel} />
          </Suspense>
        </ClientOnly>
      </Panel>
    </div>
  );
}
