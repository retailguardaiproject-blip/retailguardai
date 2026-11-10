import { describe, expect, it } from "vitest";
import { classifyCase, countCases } from "@/lib/case-rules";

const base = (o: Record<string, unknown>) => ({
  "Case ID": "X", "Store ID": "S001", "Product ID": "P001", Category: "Electronics",
  "Source Units Sold": 10, "Source Discount (%)": 5, "Synthetic Customer Returns Restocked": 0,
  "Inventory Variance (actual - expected)": 0, ...o,
});

describe("Group 1: high priority", () => {
  it("inventory + discount is high priority", () => {
    const c = classifyCase(base({ "Inventory Variance (actual - expected)": -61, "Source Discount (%)": 25 }));
    expect(c["Review Priority"]).toBe("High review priority");
    expect(c["Data Status"]).toBe("Anomalous Rule Trigger");
    expect(c["Evidence / Explanation"]).toMatch(/^\[ALERT\] Inventory Shrinkage Alert \(-61 units\) combined with Discount Alert \(25\.0% >= 20%\)/);
  });
  it("inventory surplus + returns is high priority", () => {
    const c = classifyCase(base({ "Inventory Variance (actual - expected)": 54, "Synthetic Customer Returns Restocked": 8 }));
    expect(c["Evidence / Explanation"]).toContain("Inventory Surplus Alert (+54 units) combined with Returns Alert (8 restocked units >= 4)");
  });
  it("triple anomaly is critical", () => {
    const c = classifyCase(base({ "Inventory Variance (actual - expected)": -73, "Source Discount (%)": 35, "Synthetic Customer Returns Restocked": 6 }));
    expect(c["Evidence / Explanation"]).toMatch(/^\[CRITICAL ALERT\] Triple Anomaly/);
  });
});

describe("Group 2: medium priority", () => {
  it("standalone inventory", () => {
    const c = classifyCase(base({ "Inventory Variance (actual - expected)": -51 }));
    expect(c["Review Priority"]).toBe("Review");
    expect(c["Evidence / Explanation"]).toMatch(/^\[NOTICE\] Standalone Inventory Shrinkage Alert \(-51 units detected\)/);
  });
  it("standalone discount", () => {
    expect(classifyCase(base({ "Source Discount (%)": 30 }))["Evidence / Explanation"]).toContain("Standalone Discount Alert (30.0% >= 20% threshold)");
  });
  it("standalone returns", () => {
    expect(classifyCase(base({ "Synthetic Customer Returns Restocked": 7 }))["Evidence / Explanation"]).toContain("Standalone Returns Alert (7 restocked units >= 4 threshold)");
  });
});

describe("Group 3: validation failures", () => {
  it("ERR-01 non-numeric / negative -> INVALID_SCHEMA", () => {
    const c = classifyCase(base({ "Source Inventory Level": "NOT_A_NUMBER", "Source Units Sold": -5 }));
    expect(c["Data Status"]).toBe("INVALID_SCHEMA");
    expect(c["Evidence / Explanation"]).toContain("[SCHEMA ERROR]");
  });
  it("ERR-02 overflow and discount > 100 -> REVIEW_DATA", () => {
    const c = classifyCase(base({ "Source Units Sold": "99999999999999999999", "Source Discount (%)": 250 }));
    expect(c["Data Status"]).toBe("REVIEW_DATA");
    expect(c["Evidence / Explanation"]).toContain("64-bit");
    expect(c["Evidence / Explanation"]).toContain("250%");
  });
  it("ERR-03 corrupted stock -> REVIEW_DATA", () => {
    const c = classifyCase(base({ "Synthetic Opening Stock": "CORRUPTED_STOCK" }));
    expect(c["Data Status"]).toBe("REVIEW_DATA");
    expect(c["Evidence / Explanation"]).toContain("[EXECUTION ERROR]");
  });
  it("ERR-04 SQL injection is blocked", () => {
    const c = classifyCase(base({ "Synthetic Actual Closing Stock": "'SQL_INJECT'; DROP TABLE Transactions;--" }));
    expect(c["Data Status"]).toBe("INVALID_SCHEMA");
    expect(c["Synthetic Actual Closing Stock"]).toBe("[BLOCKED]");
    expect(c["Evidence / Explanation"]).toContain("[SECURITY ALERT]");
  });
  it("ERR-05 missing keys -> INVALID_SCHEMA", () => {
    const c = classifyCase(base({ "Store ID": "", "Product ID": null, Category: " " }));
    expect(c["Data Status"]).toBe("INVALID_SCHEMA");
  });
  it("validation failures are counted", () => {
    const rows = [base({ "Store ID": "" }), base({ "Synthetic Opening Stock": "x" }), base({})].map(classifyCase);
    expect(countCases(rows).recordsWithValidationIssues).toBe(2);
  });
});
