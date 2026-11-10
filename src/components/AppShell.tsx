import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { LayoutDashboard, Search, Store, ChevronsLeft, ShieldCheck, UserCheck } from "lucide-react";
import { useFilters } from "@/lib/filters";
import { useCategories } from "@/hooks/useDashboardData";
import { cn } from "@/lib/utils";
import { AuthButton } from "./AuthButton";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/cases", label: "Case Explorer", icon: Search },
  { to: "/stores", label: "Store Intelligence", icon: Store },
  { to: "/admin", label: "Access Review", icon: UserCheck },
] as const;

function Sel({ value, onChange, opts, label }: { value: string; onChange: (v: string) => void; opts: [string, string][]; label: string }) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-input bg-secondary px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const f = useFilters();
  const cats = useCategories();

  return (
    <div className="flex min-h-screen">
      <aside className={cn("sticky top-0 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all", collapsed ? "w-16" : "w-60")}>
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <ShieldCheck className="h-6 w-6 shrink-0 text-primary" />
          {!collapsed && <span className="font-semibold tracking-tight">RetailGuard <span className="text-primary">AI</span></span>}
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} activeOptions={{ exact: true }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground glow-primary" }}>
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && label}
            </Link>
          ))}
        </nav>
        <button onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar" className="m-2 flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-sidebar-accent">
          <ChevronsLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-[500] flex h-14 items-center gap-5 border-b border-border bg-background/90 px-6 backdrop-blur">
          <Sel label="Region" value={f.region} onChange={f.setRegion} opts={[["all", "All regions"], ["ne", "Northeast"]]} />
          <Sel label="Time" value={f.range} onChange={f.setRange} opts={[["24h", "Last 24h"], ["7d", "Last 7 days"]]} />
          <Sel label="Category" value={f.category} onChange={f.setCategory} opts={[["all", "All categories"], ...cats.map((c) => [c, c] as [string, string])]} />
          <div className="ml-auto"><AuthButton /></div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
