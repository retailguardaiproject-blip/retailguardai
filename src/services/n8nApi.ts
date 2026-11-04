import type { AnomalyCase } from "@/lib/types";
import sampleCases from "@/data/sample-cases.json";

// Spreadsheet stock movements are illustrative, not live inventory observations.
const SAMPLE_CASES = sampleCases as AnomalyCase[];

export async function fetchSummary(): Promise<AnomalyCase[]> {
  return SAMPLE_CASES;
}
