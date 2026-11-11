import { createContext, useContext, useState, type ReactNode } from "react";

type Filters = {
  region: string; setRegion: (v: string) => void;
  range: string; setRange: (v: string) => void;
  category: string; setCategory: (v: string) => void;
  dataStatus: string; setDataStatus: (v: string) => void;
  issueType: string; setIssueType: (v: string) => void;
};
const Ctx = createContext<Filters | null>(null);

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [region, setRegion] = useState("all");
  const [range, setRange] = useState("7d");
  const [category, setCategory] = useState("all");
  const [dataStatus, setDataStatus] = useState("all");
  const [issueType, setIssueType] = useState("all");
  return <Ctx.Provider value={{ region, setRegion, range, setRange, category, setCategory, dataStatus, setDataStatus, issueType, setIssueType }}>{children}</Ctx.Provider>;
}

export function useFilters() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useFilters outside provider");
  return v;
}

// Store coordinates (n8n data has no location fields yet).
export const STORE_LOCATIONS: Record<string, { name: string; lat: number; lng: number }> = {
  S001: { name: "Downtown Flagship", lat: 40.7128, lng: -74.006 },
  S002: { name: "Brooklyn Heights", lat: 40.6958, lng: -73.9936 },
  S003: { name: "Jersey City", lat: 40.7178, lng: -74.0431 },
  S004: { name: "Queens Plaza", lat: 40.7489, lng: -73.9372 },
  S005: { name: "Hoboken", lat: 40.744, lng: -74.0324 },
};

export function storeLoc(id: string) {
  if (STORE_LOCATIONS[id]) return STORE_LOCATIONS[id];
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 10000;
  return { name: id, lat: 40.65 + (h % 100) / 600, lng: -74.1 + Math.floor(h / 100) / 500 };
}
