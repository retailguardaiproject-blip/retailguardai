#####Prompts used for Website building#####

Create RetailGuard AI, an inventory anomaly
Markdown · 31 lines
Create "RetailGuard AI," an inventory anomaly and fraud detection dashboard. The application must feature a sophisticated, dark-themed analytics UI matching the provided reference images. It must be fully integrated with a live n8n Webhook as its sole operational data source.
Visual Design System (Based on Reference Images) Theme: Strict dark mode. Backgrounds should use deep charcoal/black (#0D0F12 or similar) with slightly lighter elevated panels (#16191E). Accents: Use neon teal/cyan for primary actions and active states. Use semantic colors for statuses (Red for High Priority/Critical, Orange/Yellow for Review, Green for Normal). Layout Structure: Collapsible left navigation sidebar with icons (Overview, Case Explorer, Store Intelligence, Settings). Top global filter bar (Region, Time Range, Category). Dense, widget-based dashboard layout with subtle borders and glowing data visualizations.
Page 1: Overview Dashboard (Reference: Image 1) Recreate the layout of the "Incidents Management" screen, adapted for inventory data: Top Left - Health Gauge: Create a circular "Inventory Health Score" gauge (replacing the Incident Health Score) showing the percentage of unflagged stores/products. Below it, list KPI rows: Active Cases, Critical Cases, Avg Resolution Time. Top Center - Primary KPIs: Replace the network topology map with prominent KPI stat blocks: "Total Records Analyzed," "Total Flagged Alerts," "High Priority Reviews," and "Estimated Discrepancy Value." Use the neon green/red text for +/- trend indicators. Bottom Left - AI Investigation Box: A dedicated text panel with a teal border titled "AI Investigation Summary" that displays the Evidence / Explanation from the latest high-priority anomaly. Bottom Center - Global Anomaly Radar: A data table (replacing "Global Threat Radar") listing recent anomalies. Columns: Case ID, Assigned To, Store, Variance, Severity, Time. Right Column - Trends & Timeline: Include a vertical timeline showing the status of the current selected case (Detection -> Investigation -> Verification -> Resolution). Below it, add an "Anomaly Volume Trend" area/line chart over a 24-hour/7-day period.
Page 2: Case Explorer & Store Map (Reference: Image 2) Recreate the split-screen investigation view from the second image: Left Panel - Case Explorer Table: A searchable, filterable list of all cases. Columns: Case ID, Category, Review Priority, and Variance (replacing "Amount"). Include checkboxes for multi-select. Right Panel - Dark Store Map: A large, dark-themed map (using Mapbox or Leaflet with a dark tile layer). When a case is clicked in the left panel, the map must center on the corresponding Store location with a prominent map pin. Map Tooltip: Clicking the map pin should reveal the AI's Recommended Next Check for that specific store/product.
Mandatory Data Architecture (n8n Webhook Integration) The UI must NOT use mock data for its final state or connect to Supabase for inventory data. It must consume data from an n8n webhook. API Service: Create src/services/n8nApi.ts that fetches from import.meta.env.VITE_N8N_SUMMARY_API_URL via a GET request. Data Types: Define AnomalyCase with exact fields: Case ID, Store ID, Product ID, Category, Expected Closing Stock, Synthetic Actual Closing Stock, Inventory Variance (actual - expected), Review Priority ("High review priority", "Review", "No rule-based alert"), Evidence / Explanation, and Recommended Next Check. State Management: Use a React hook (useDashboardData.ts) to fetch and store the n8n data. Apply this data directly to the KPI cards, the Case Explorer table, and the AI Investigation text panels.
Implementation Steps Scaffold the dark-mode theme, sidebar, and routing. Build the Overview page widgets (Gauge, KPIs, AI Text Box, Line Chart). Build the split-screen Case Explorer with the dark map. Implement the useDashboardData hook. While VITE_N8N_SUMMARY_API_URL is empty, use a 5-item mock array matching the AnomalyCase interface. Ensure all charts, tables, and text panels dynamically consume the context data so the UI comes alive as soon as the n8n URL is provided.

Casewise Summary Studio is only partly built. The dark theme, the n8n data connection and the 5 sample cases are in place, but none of the screens exist yet. The app still opens to the blank starter page.

Done so far:
- Dark theme: charcoal panels with teal highlights, plus red, orange and green for case status.
- n8n connection: the app fetches cases from the address in `VITE_N8N_SUMMARY_API_URL`. Until that address is set, it shows the 5 sample cases.
- Filters: Region and Category filter the data, and a selected-case setting is ready for the map. The Time Range option exists but doesn't affect anything yet.
- Store locations: the map will need coordinates for each store, and your data doesn't include any. I added 5 example Indian cities for the sample stores. Any other store gets a made-up but fixed spot on the map. Please send real store locations if you have them.
- Assigned To and Time: these columns in the anomaly table aren't in your data either. Analyst names will be filled in from a sample list, and the Time column still needs filling.

Still to build:
- The collapsible side menu and the top filter bar.
- The Overview page: health score dial, KPI blocks, AI Investigation Summary box, anomaly table, case timeline and trend chart.
- The Case Explorer page: searchable case list with the dark store map and the "Recommended Next Check" pop-up.
- Page titles and descriptions for sharing, then a check that everything works.

Should I continue building the pages?


# Casewise Summary Studio

Your approach is right: an HTTP Request node (POST) after the summary node, sending to an endpoint on the Lovable side. The trick is that Lovable needs something to receive the data. There are two common patterns.

**Option 1: Push (what you're doing)**

1. In Lovable, ask it to create a backend endpoint that accepts a POST with JSON. This is usually a Supabase Edge Function, since Lovable apps use Supabase. The function validates a secret header and stores the data in a Supabase table.

2. The dashboard reads from that table, so it stays current without extra work.

3. In n8n, configure the HTTP Request node:

   - **Method:** POST

   - **URL:** the Edge Function URL Lovable gives you

   - **Authentication:** Generic Credential Type, then Header Auth (for example `x-api-key: <shared secret>`). Use a secret you invent and store in both places. This is not an n8n API key.

   - **Send Body:** on, **Body Content Type:** JSON, and map the summary node's output (for example `{{ $json }}`).

**Option 2: Pull (often simpler and more robust)**

Add a **Webhook** node in n8n with Header Auth, and have the Respond to Webhook node return the summary JSON. The Lovable app calls that URL when the dashboard loads. The downside is that the workflow runs on every request, which can be slow if the analysis is heavy.

**Recommendation:** use Option 1 if the dashboard should show stored or historical results. Use Option 2 for a quick, on-demand view.

Some things to watch for:

- Lovable's preview and published apps may have CORS limits on browser-to-n8n calls. This is why the n8n-to-Edge-Function direction (Option 1) is safer.

- Never put the secret in the front-end code.

If you share the Edge Function URL and the shape of your summary JSON, I can configure the HTTP Request node in your workflow.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://retailguardai.lovable.app


## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/57abe9f6-dda3-4ea8-912a-1bec464f53fb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
