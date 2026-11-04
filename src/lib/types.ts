export type ReviewPriority = "High review priority" | "Review" | "No rule-based alert";

export interface AnomalyCase {
  "Case ID": string;
  "Store ID": string;
  "Product ID": string;
  Category: string;
  "Expected Closing Stock": number;
  "Synthetic Actual Closing Stock": number;
  "Inventory Variance (actual - expected)": number;
  "Review Priority": ReviewPriority;
  "Evidence / Explanation": string;
  "Recommended Next Check": string;
}

export const VARIANCE = "Inventory Variance (actual - expected)" as const;
