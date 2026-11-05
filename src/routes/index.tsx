import { createFileRoute } from "@tanstack/react-router";
import { LatestSummary } from "@/components/LatestSummary";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview · RetailGuard AI" },
      { name: "description", content: "Latest RetailGuard AI investigation summary delivered by n8n." },
      { property: "og:title", content: "Overview · RetailGuard AI" },
      { property: "og:description", content: "Latest RetailGuard AI investigation summary delivered by n8n." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Overview,
});

function Overview() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Overview</h1>
      <LatestSummary />
    </div>
  );
}
