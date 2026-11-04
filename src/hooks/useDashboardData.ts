import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { liveSummary } from "@/lib/n8n.functions";
import { useConnectionSession } from "./useConnection";
import { fetchSummary } from "@/services/n8nApi";
import { useFilters } from "@/lib/filters";
import { VARIANCE, type AnomalyCase } from "@/lib/types";

export function useDashboardData() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const signedIn = useConnectionSession();
  const getLive = useServerFn(liveSummary);
  const q = useQuery({ enabled: hydrated, queryKey: ["n8n-summary", signedIn], queryFn: async () => {
    if (signedIn) {const result = await getLive(); if(result.live) return result;}
    return {live: false, cases: await fetchSummary()};
  }, refetchInterval: 60_000, retry: false });
  const { category } = useFilters();
  const all = hydrated ? (q.data?.cases ?? []) : [];
  const cases = category === "all" ? all : all.filter((c) => c.Category === category);
  return { ...q, live: q.data?.live ?? false, isLoading: !hydrated || q.isLoading, all, cases, kpis: computeKpis(cases) };
}

export function computeKpis(cases: AnomalyCase[]) {
  const flagged = cases.filter((c) => c["Review Priority"] !== "No rule-based alert");
  const high = cases.filter((c) => c["Review Priority"] === "High review priority");
  const discrepancy = cases.reduce((s, c) => s + Math.abs(c[VARIANCE] ?? 0), 0);
  const health = cases.length ? Math.round(((cases.length - flagged.length) / cases.length) * 100) : 100;
  return { total: cases.length, flagged: flagged.length, high: high.length, discrepancy, health };
}
