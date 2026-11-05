import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Panel, PriorityBadge, Variance } from "@/components/ui-kit";
import { VARIANCE } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LatestSummary } from "@/components/LatestSummary";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview · RetailGuard AI" },
      { name: "description", content: "Inventory health, flagged alerts and AI investigation summaries." },
      { property: "og:title", content: "Overview · RetailGuard AI" },
      { property: "og:description", content: "Inventory health, flagged alerts and AI investigation summaries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Overview,
});

const ASSIGNEES = ["A. Rivera", "J. Chen", "M. Patel", "S. Okafor", "L. Novak"];
const STAGES = ["Detection", "Investigation", "Verification", "Resolution"];

function Gauge({ value }: { value: number }) {
  const r = 70, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 180 180" className="mx-auto h-44 w-44">
      <circle cx="90" cy="90" r={r} fill="none" stroke="var(--muted)" strokeWidth="12" />
      <circle cx="90" cy="90" r={r} fill="none" stroke="var(--primary)" strokeWidth="12" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} transform="rotate(-90 90 90)"
        style={{ filter: "drop-shadow(0 0 8px var(--primary))" }} />
      <text x="90" y="88" textAnchor="middle" fill="var(--foreground)" fontSize="34" fontWeight="600">{value}%</text>
      <text x="90" y="112" textAnchor="middle" fill="var(--muted-foreground)" fontSize="11">HEALTHY</text>
    </svg>
  );
}

function Stat({ label, value, trend, bad }: { label: string; value: string; trend: string; bad?: boolean }) {
  return (
    <div className="panel p-4">
      <div className="label-caps">{label}</div>
      <div className="mt-2 font-mono text-3xl font-semibold">{value}</div>
      <div className={cn("mt-1 text-xs", bad ? "text-critical" : "text-success")}>{trend}</div>
    </div>
  );
}

function Overview() {
  const { cases, kpis } = useDashboardData();
  const [selected, setSelected] = useState<string | null>(null);
  const highs = cases.filter((c) => c["Review Priority"] === "High review priority");
  const latestHigh = highs[0];
  const sel = cases.find((c) => c["Case ID"] === selected) ?? latestHigh ?? cases[0];
  const stage = sel ? (sel["Review Priority"] === "High review priority" ? 1 : sel["Review Priority"] === "Review" ? 2 : 3) : 0;

  const trend = Array.from({ length: 7 }, (_, i) => ({
    day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
    anomalies: Math.max(0, Math.round(kpis.flagged * (0.5 + ((i * 37) % 10) / 10))),
  }));

  return (
    <div className="space-y-4"><LatestSummary /><div className="grid gap-4 xl:grid-cols-[280px_1fr_320px]">
      <Panel title="Inventory Health Score">
        <Gauge value={kpis.health} />
        <dl className="mt-4 space-y-2 text-sm">
          {[["Active cases", kpis.flagged], ["Critical cases", kpis.high], ["Avg resolution time", "4.2h"]].map(([k, v]) => (
            <div key={k as string} className="flex justify-between border-t border-border pt-2">
              <dt className="text-muted-foreground">{k}</dt><dd className="font-mono">{v}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      <div className="grid grid-cols-2 gap-4 self-start">
        <Stat label="Total records analyzed" value={kpis.total.toLocaleString()} trend="+12% vs last period" />
        <Stat label="Total flagged alerts" value={String(kpis.flagged)} trend="+3 vs last period" bad />
        <Stat label="High priority reviews" value={String(kpis.high)} trend="+1 vs last period" bad />
        <Stat label="Est. discrepancy (units)" value={kpis.discrepancy.toLocaleString()} trend="−8% vs last period" />
      </div>

      <Panel title="Case Status Timeline" className="xl:row-span-2">
        {sel && <p className="mb-4 font-mono text-sm text-primary">{sel["Case ID"]}</p>}
        <ol className="relative ml-2 border-l border-border">
          {STAGES.map((s, i) => (
            <li key={s} className="mb-6 ml-5">
              <span className={cn("absolute -left-[7px] h-3.5 w-3.5 rounded-full border-2 border-background", i <= stage ? "bg-primary glow-primary" : "bg-muted")} />
              <p className={cn("text-sm font-medium", i <= stage ? "text-foreground" : "text-muted-foreground")}>{s}</p>
              <p className="text-xs text-muted-foreground">{i < stage ? "Complete" : i === stage ? "In progress" : "Pending"}</p>
            </li>
          ))}
        </ol>
        <h3 className="label-caps mb-2 mt-4">Anomaly Volume Trend · 7d</h3>
        <div className="h-44">
          <ResponsiveContainer>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} width={24} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} />
              <Area dataKey="anomalies" stroke="var(--primary)" fill="url(#g)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="AI Investigation Summary" className="border-primary/60 glow-primary">
        {latestHigh ? (
          <>
            <p className="mb-2 font-mono text-xs text-primary">{latestHigh["Case ID"]} · {latestHigh["Store ID"]}</p>
            <p className="text-sm leading-relaxed">{latestHigh["Evidence / Explanation"]}</p>
            <p className="mt-3 text-xs text-muted-foreground">Next check: {latestHigh["Recommended Next Check"]}</p>
          </>
        ) : <p className="text-sm text-muted-foreground">No high-priority anomalies.</p>}
      </Panel>

      <Panel title="Global Anomaly Radar">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>{["Case ID", "Assigned To", "Store", "Variance", "Severity", "Time"].map((h) => <th key={h} className="pb-2 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {cases.map((c, i) => (
                <tr key={c["Case ID"]} onClick={() => setSelected(c["Case ID"])}
                  className={cn("cursor-pointer border-t border-border hover:bg-accent/40", sel?.["Case ID"] === c["Case ID"] && "bg-accent/50")}>
                  <td className="py-2 font-mono text-primary">{c["Case ID"]}</td>
                  <td>{ASSIGNEES[i % ASSIGNEES.length]}</td>
                  <td>{c["Store ID"]}</td>
                  <td><Variance v={c[VARIANCE]} /></td>
                  <td><PriorityBadge p={c["Review Priority"]} /></td>
                  <td className="text-muted-foreground">{(i + 1) * 12}m ago</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div></div>
  );
}
