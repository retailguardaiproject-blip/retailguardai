import { createFileRoute } from "@tanstack/react-router";
import { Panel } from "@/components/ui-kit";
import { isLive } from "@/services/n8nApi";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · RetailGuard AI" },
      { name: "description", content: "Data source connection status for RetailGuard AI." },
      { property: "og:title", content: "Settings · RetailGuard AI" },
      { property: "og:description", content: "Data source connection status for RetailGuard AI." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <Panel title="Data Source" className="max-w-xl">
      <p className="text-sm">n8n summary feed: <span className={isLive() ? "text-success" : "text-warning"}>{isLive() ? "Connected" : "Not connected — showing sample data"}</span></p>
      <p className="mt-2 text-sm text-muted-foreground">Data refreshes every 60 seconds once connected.</p>
    </Panel>
  );
}
