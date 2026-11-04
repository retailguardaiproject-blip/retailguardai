import { useQuery } from "@tanstack/react-query";
import { fetchSummary } from "@/services/n8nApi";
import { useFilters } from "@/lib/filters";
import { VARIANCE, type AnomalyCase } from "@/lib/types";

export function useDashboardData() {
  const q = useQuery({ queryKey: ["n8n-summary"], queryFn: fetchSummary, refetchInterval: 60_000 });
  const { category } = useFilters();
  const all = q.data ?? [];
  const cases = category === "all" ? all : all.filter((c) => c.Category === category);
  return { ...q, all, cases, kpis: computeKpis(cases) };
}

export function computeKpis(cases: AnomalyCase[]) {
  const flagged = cases.filter((c) => c["Review Priority"] !== "No rule-based alert");
  const high = cases.filter((c) => c["Review Priority"] === "High review priority");
  const discrepancy = cases.reduce((s, c) => s + Math.abs(c[VARIANCE] ?? 0), 0);
  const health = cases.length ? Math.round(((cases.length - flagged.length) / cases.length) * 100) : 100;
  return { total: cases.length, flagged: flagged.length, high: high.length, discrepancy, health };
}
