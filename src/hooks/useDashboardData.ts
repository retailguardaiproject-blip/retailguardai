import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import sampleCases from "@/data/sample-cases.json";
import { useFilters } from "@/lib/filters";
import { latestSummary } from "@/lib/summary.functions";
import { useConnectionSession } from "@/hooks/useConnection";
import { VARIANCE, type AnomalyCase } from "@/lib/types";
import { caseDataStatus, caseIssueType } from "@/lib/case-rules";

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
  const { category, dataStatus, issueType } = useFilters();
  const { data } = useLatestSummary();
  const live = deliveredCases(data);
  const all = live ?? SAMPLE_CASES;
  const cases = all.filter((c) =>
    (category === "all" || c.Category === category) &&
    (dataStatus === "all" || caseDataStatus(c) === dataStatus) &&
    (issueType === "all" || caseIssueType(c) === issueType));
  return { all, cases, live: !!live, kpis: computeKpis(cases) };
}

// Distinct Data Status values and issue-type tags present in the current cases, for the header filters.
export function useCaseFacets() {
  const { data } = useLatestSummary();
  const all = deliveredCases(data) ?? SAMPLE_CASES;
  const statuses = Array.from(new Set(all.map(caseDataStatus))).sort();
  const issueTypes = Array.from(new Set(all.map(caseIssueType).filter(Boolean))).sort();
  return { statuses, issueTypes };
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
