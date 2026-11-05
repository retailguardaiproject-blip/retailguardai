import sampleCases from "@/data/sample-cases.json";
import { useFilters } from "@/lib/filters";
import { VARIANCE, type AnomalyCase } from "@/lib/types";

// Case-level reference rows from the uploaded spreadsheet (Case Explorer / Store Intelligence).
// Live n8n results arrive as summaries in the database, not as case rows.
export const SAMPLE_CASES = sampleCases as AnomalyCase[];

export function useDashboardData() {
  const { category } = useFilters();
  const all = SAMPLE_CASES;
  const cases = category === "all" ? all : all.filter((c) => c.Category === category);
  return { all, cases, kpis: computeKpis(cases) };
}

export function computeKpis(cases: AnomalyCase[]) {
  const flagged = cases.filter((c) => c["Review Priority"] !== "No rule-based alert");
  const high = cases.filter((c) => c["Review Priority"] === "High review priority");
  const discrepancy = cases.reduce((s, c) => s + Math.abs(c[VARIANCE] ?? 0), 0);
  const health = cases.length ? Math.round(((cases.length - flagged.length) / cases.length) * 100) : 100;
  return { total: cases.length, flagged: flagged.length, high: high.length, discrepancy, health };
}
