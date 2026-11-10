import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import sampleCases from "@/data/sample-cases.json";
import { useFilters } from "@/lib/filters";
import { latestSummary } from "@/lib/summary.functions";
import { useConnectionSession } from "@/hooks/useConnection";
import { VARIANCE, type AnomalyCase } from "@/lib/types";

// Reference rows from the uploaded spreadsheet, used only until n8n delivers case rows.
export const SAMPLE_CASES = sampleCases as AnomalyCase[];

export function useLatestSummary() {
  const signedIn = useConnectionSession();
  const read = useServerFn(latestSummary);
  const q = useQuery({ queryKey: ["latest-summary", signedIn], queryFn: () => read(), enabled: signedIn, refetchInterval: 30000, retry: false });
  return { signedIn, ...q };
}

export function deliveredCases(row: { cases?: unknown } | null | undefined): AnomalyCase[] | null {
  if (!row || !Array.isArray(row.cases)) return null;
  return (row.cases as Record<string, unknown>[]).map((c) => ({
    ...c,
    "Case ID": String(c["Case ID"]),
    [VARIANCE]: Number(c[VARIANCE] ?? 0),
  })) as unknown as AnomalyCase[];
}

export function useDashboardData() {
  const { category } = useFilters();
  const { data } = useLatestSummary();
  const live = deliveredCases(data);
  const all = live ?? SAMPLE_CASES;
  const cases = category === "all" ? all : all.filter((c) => c.Category === category);
  return { all, cases, live: !!live, kpis: computeKpis(cases) };
}

export function useCategories() {
  const { data } = useLatestSummary();
  const all = deliveredCases(data) ?? SAMPLE_CASES;
  return Array.from(new Set(all.map((c) => c.Category)));
}

export function computeKpis(cases: AnomalyCase[]) {
  const flagged = cases.filter((c) => c["Review Priority"] !== "No rule-based alert");
  const high = cases.filter((c) => c["Review Priority"] === "High review priority");
  const discrepancy = cases.reduce((s, c) => s + Math.abs(c[VARIANCE] ?? 0), 0);
  const health = cases.length ? Math.round(((cases.length - flagged.length) / cases.length) * 100) : 100;
  return { total: cases.length, flagged: flagged.length, high: high.length, discrepancy, health };
}
