import { describe, expect, it } from "vitest";
import { SAMPLE_CASES, computeKpis } from "@/hooks/useDashboardData";

describe("Uploaded spreadsheet sample cases", () => {
  it("loads all 750 spreadsheet cases for the case explorer", () => {
    expect(SAMPLE_CASES).toHaveLength(750);
    expect(SAMPLE_CASES[0]?.["Case ID"]).toBe("RG-0001");
    expect(computeKpis(SAMPLE_CASES)).toEqual({ total: 750, flagged: 379, high: 32, discrepancy: 574, health: 49 });
  });
});
