import type { AnomalyCase } from "@/lib/types";

const MOCK: AnomalyCase[] = [
  {
    "Case ID": "RG-1042", "Store ID": "S001", "Product ID": "P-7781", Category: "Electronics",
    "Expected Closing Stock": 120, "Synthetic Actual Closing Stock": 84,
    "Inventory Variance (actual - expected)": -36, "Review Priority": "High review priority",
    "Evidence / Explanation": "Closing stock fell 30% below expected with no matching sales or transfer records over 3 consecutive days. Pattern aligns with after-hours shrinkage.",
    "Recommended Next Check": "Pull CCTV for stockroom 22:00–02:00 and reconcile receiving logs for last 72h.",
  },
  {
    "Case ID": "RG-1043", "Store ID": "S004", "Product ID": "P-2210", Category: "Apparel",
    "Expected Closing Stock": 340, "Synthetic Actual Closing Stock": 318,
    "Inventory Variance (actual - expected)": -22, "Review Priority": "Review",
    "Evidence / Explanation": "Moderate negative variance concentrated in one SKU size range; returns volume elevated.",
    "Recommended Next Check": "Audit return receipts for P-2210 and verify restock scans.",
  },
  {
    "Case ID": "RG-1044", "Store ID": "S002", "Product ID": "P-0912", Category: "Grocery",
    "Expected Closing Stock": 560, "Synthetic Actual Closing Stock": 561,
    "Inventory Variance (actual - expected)": 1, "Review Priority": "No rule-based alert",
    "Evidence / Explanation": "Variance within tolerance.",
    "Recommended Next Check": "No action required.",
  },
  {
    "Case ID": "RG-1045", "Store ID": "S003", "Product ID": "P-4450", Category: "Electronics",
    "Expected Closing Stock": 75, "Synthetic Actual Closing Stock": 52,
    "Inventory Variance (actual - expected)": -23, "Review Priority": "High review priority",
    "Evidence / Explanation": "Repeated manual stock adjustments by the same user ID preceding the shortfall.",
    "Recommended Next Check": "Review adjustment audit trail for user ID and interview shift lead.",
  },
  {
    "Case ID": "RG-1046", "Store ID": "S005", "Product ID": "P-3301", Category: "Home",
    "Expected Closing Stock": 210, "Synthetic Actual Closing Stock": 228,
    "Inventory Variance (actual - expected)": 18, "Review Priority": "Review",
    "Evidence / Explanation": "Positive variance suggests a missed outbound transfer or duplicate receiving.",
    "Recommended Next Check": "Check transfer orders to sister stores and receiving duplicates.",
  },
];

export const isLive = () => Boolean(import.meta.env.VITE_N8N_SUMMARY_API_URL);

export async function fetchSummary(): Promise<AnomalyCase[]> {
  const url = import.meta.env.VITE_N8N_SUMMARY_API_URL as string | undefined;
  if (!url) return MOCK;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`n8n ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const rows = Array.isArray(json) ? json : (json.cases ?? json.data ?? []);
  return rows as AnomalyCase[];
}
