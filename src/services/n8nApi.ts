import type { AnomalyCase } from "@/lib/types";
import sampleCases from "@/data/sample-cases.json";

// Spreadsheet stock movements are illustrative, not live inventory observations.
const SAMPLE_CASES = sampleCases as AnomalyCase[];

export const isLive = () => Boolean(import.meta.env["VITE_N8N_SUMMARY_API_URL"]);

export async function fetchSummary(): Promise<AnomalyCase[]> {
  const url = import.meta.env["VITE_N8N_SUMMARY_API_URL"] as string | undefined;
  if (!url) return SAMPLE_CASES;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`n8n ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const rows = Array.isArray(json) ? json : (json.cases ?? json.data ?? []);
  return rows as AnomalyCase[];
}
