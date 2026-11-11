import { describe, expect, it } from "vitest";
import { caseDataStatus, caseIssueType, classifyCase } from "@/lib/case-rules";

describe("caseDataStatus", () => {
  it("defaults to Valid when the row has no Data Status column", () => {
    expect(caseDataStatus({ "Case ID": "RG-0001" })).toBe("Valid");
  });
  it("returns the stored Data Status", () => {
    expect(caseDataStatus({ "Data Status": "INVALID_SCHEMA" })).toBe("INVALID_SCHEMA");
  });
});

describe("caseIssueType", () => {
  it("extracts the leading bracketed tag from evidence", () => {
    expect(caseIssueType({ "Evidence / Explanation": "[SCHEMA ERROR] Field 'X' expects integer." })).toBe("SCHEMA ERROR");
    expect(caseIssueType({ "Evidence / Explanation": "[SECURITY ALERT] SQL Injection attempt." })).toBe("SECURITY ALERT");
  });
  it("returns empty string when there is no tag", () => {
    expect(caseIssueType({ "Evidence / Explanation": "plain text" })).toBe("");
    expect(caseIssueType({})).toBe("");
  });
});

describe("classifyCase facets", () => {
  it("marks a schema failure as INVALID_SCHEMA with a SCHEMA ERROR tag", () => {
    const c = classifyCase({ "Case ID": "T1", "Store ID": "S001", "Product ID": "P1", Category: "Grocery", "Source Units Sold": "abc" });
    expect(caseDataStatus(c)).toBe("INVALID_SCHEMA");
    expect(caseIssueType(c)).toBe("SCHEMA ERROR");
  });
  it("marks a single rule alert as Anomalous Rule Trigger with a NOTICE tag", () => {
    const c = classifyCase({ "Case ID": "T2", "Store ID": "S001", "Product ID": "P1", Category: "Grocery", "Source Discount (%)": 25 });
    expect(caseDataStatus(c)).toBe("Anomalous Rule Trigger");
    expect(caseIssueType(c)).toBe("NOTICE");
  });
});
