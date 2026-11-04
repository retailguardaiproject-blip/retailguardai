import { describe, expect, it } from "vitest";
import { fetchSummary } from "@/services/n8nApi";
import { computeKpis } from "@/hooks/useDashboardData";

describe("Uploaded spreadsheet sample cases", () => {
  it("uses all 750 spreadsheet cases when no n8n URL is configured", async () => {
    const cases = await fetchSummary();
    expect(cases).toHaveLength(750);
    expect(cases[0]?.["Case ID"]).toBe("RG-0001");
    expect(cases[0]?.["Expected Closing Stock"]).toBe(81);
    expect(cases[0]?.["Synthetic Actual Closing Stock"]).toBe(81);
    expect(computeKpis(cases)).toEqual({ total: 750, flagged: 379, high: 32, discrepancy: 574, health: 49 });
  });
});