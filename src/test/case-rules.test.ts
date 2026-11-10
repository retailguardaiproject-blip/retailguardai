import { describe, expect, it } from "vitest";
import { countCases, normalizePayload } from "@/lib/case-rules";

const mk = (id: number, inv = "No variance alert") => ({ "Case ID": `C-${id}`, "Inventory Alert": inv, "Review Priority": "Review" });

describe("n8n payloads", () => {
  it("accepts any number of cases sent as a plain array", () => {
    const cases = Array.from({ length: 42 }, (_, i) => mk(i));
    expect(normalizePayload(cases).cases).toHaveLength(42);
  });
  it("accepts n8n items wrapped in json", () => {
    expect(normalizePayload([{ json: mk(1) }, { json: mk(2) }]).cases).toHaveLength(2);
  });
  it("counts totals from the delivered cases", () => {
    const c = countCases([mk(1, "Review: lower than expected"), mk(2), mk(3)]);
    expect(c.totalRecords).toBe(3);
    expect(c.inventoryAlerts).toBe(1);
    expect(c.recordsRequiringReview).toBe(3);
  });
});
