import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ReviewPriority } from "@/lib/types";

export function Panel({ title, children, className, action }: { title?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cn("panel p-4", className)}>
      {title && (
        <div className="mb-3 flex items-center justify-between">
          <h2 className="label-caps">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function PriorityBadge({ p }: { p: ReviewPriority }) {
  const style =
    p === "High review priority"
      ? "bg-critical/15 text-critical border-critical/40"
      : p === "Review"
        ? "bg-warning/15 text-warning border-warning/40"
        : "bg-success/15 text-success border-success/40";
  const label = p === "High review priority" ? "Critical" : p === "Review" ? "Review" : "Normal";
  return <span className={cn("inline-flex rounded border px-2 py-0.5 text-xs font-medium", style)}>{label}</span>;
}

export function Variance({ v }: { v: number }) {
  return <span className={cn("font-mono", v < 0 ? "text-critical" : v > 0 ? "text-warning" : "text-success")}>{v > 0 ? "+" : ""}{v}</span>;
}
