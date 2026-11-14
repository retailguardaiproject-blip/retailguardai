# RetailGuard AI
[For LogeshwariRetailGuardAI_Inventory Investigation_original.json](https://github.com/user-attachments/files/34842247/For.LogeshwariRetailGuardAI_Inventory.Investigation_original.json)
<img width="1024" height="555" alt="PHOTO-2026-11-14-11-36-02" src="https://github.com/user-attachments/assets/c8b91ff8-6c4f-4178-a131-285a442a0042" />

RetailGuard AI is an inventory anomaly and fraud detection dashboard. It transforms raw retail data into prioritized, evidence-backed cases for human review using an AI-powered pipeline, presenting the insights on a high-density, dark-themed analytics interface.

## 🏗 Architecture Overview (Push Model)

RetailGuard AI utilizes a "Push" architecture to seamlessly deliver long-running AI analysis from an automation backend to a secure frontend.

1. **The Pipeline (n8n)**: An n8n workflow fetches inventory source data, {
  "name": "For LogeshwariRetailGuardAI_Inventory Investigation_Anju copy",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "retailguard-refresh",
        "responseMode": "responseNode",
        "options": {
          "allowedOrigins": "*",
          "ignoreBots": true
        }
      },
      "id": "4efadcad-80ea-4c2b-bcb9-ed910e0da25c",
      "name": "Website Refresh Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2.2,
      "position": [
        -16,
        320
      ],
      "webhookId": "5d8a3509-199f-48fd-a61d-28b9c05a9818"
    },
    {
      "parameters": {
        "url": "https://raw.githubusercontent.com/Anju02aug/RetailGuard-AI/main/retailguard_cases.xlsx",
        "options": {
          "response": {
            "response": {
              "responseFormat": "file"
            }
          }
        }
      },
      "id": "80657462-f273-4a5a-a481-64aba5015a97",
      "name": "HTTP Request",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.5,
      "position": [
        208,
        128
      ]
    },
    {
      "parameters": {},
      "id": "4017d07d-a985-4214-b10a-db96c89ce187",
      "name": "RetailGuard AI - Inventory Investigation",
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1,
      "position": [
        0,
        128
      ]
    },
    {
      "parameters": {
        "operation": "xlsx",
        "options": {}
      },
      "id": "4df1e6fe-5ad5-4c46-ad44-e7215f4d988c",
      "name": "Extract from File1",
      "type": "n8n-nodes-base.extractFromFile",
      "typeVersion": 1.2,
      "position": [
        432,
        128
      ]
    },
    {
      "parameters": {
        "jsCode": "\nconst items = $input.all();\nconst seenCaseIds = new Set();\n\nconst num = (value) => {\n  if (value === null || value === undefined || value === '') return null;\n  const n = Number(value);\n  return Number.isFinite(n) ? n : null;\n};\n\nreturn items.map((item) => {\n  const r = item.json;\n  const caseId = r[\"Case ID\"];\n  const duplicateCaseId = caseId ? seenCaseIds.has(caseId) : false;\n  if (caseId) seenCaseIds.add(caseId);\n\n  const opening = num(r[\"Synthetic Opening Stock\"]);\n  const received = num(r[\"Synthetic Purchases Received\"]);\n  const customerReturns = num(r[\"Synthetic Customer Returns Restocked\"]);\n  const sold = num(r[\"Source Units Sold\"]);\n  const supplierReturns = num(r[\"Synthetic Supplier Returns\"]);\n  const actualClosing = num(r[\"Synthetic Actual Closing Stock\"]);\n\n  const required = [\n    opening, received, customerReturns, sold,\n    supplierReturns, actualClosing\n  ];\n\n  const missingStockInputs = required.some(v => v === null);\n\n  let expectedClosing = null;\n  let variance = null;\n\n  if (!missingStockInputs) {\n    expectedClosing =\n      opening + received + customerReturns - sold - supplierReturns;\n    variance = actualClosing - expectedClosing;\n  }\n\n  const discount = num(r[\"Source Discount (%)\"]);\n  const inventoryAlert =\n    variance !== null && Math.abs(variance) >= 5;\n  const discountAlert = discount !== null && discount >= 20;\n  const returnsAlert =\n    customerReturns !== null && customerReturns >= 4;\n\n  const alerts = [];\n  if (inventoryAlert) alerts.push(\"INVENTORY_VARIANCE\");\n  if (discountAlert) alerts.push(\"HIGH_DISCOUNT\");\n  if (returnsAlert) alerts.push(\"HIGH_CUSTOMER_RETURNS\");\n\n  const missingIdentity =\n    !caseId || !r[\"Date\"] || !r[\"Store ID\"] || !r[\"Product ID\"];\n\n  const validationIssues = [];\n  if (missingIdentity) validationIssues.push(\"Missing case/date/store/product identity\");\n  if (duplicateCaseId) validationIssues.push(\"Duplicate Case ID\");\n  if (missingStockInputs) validationIssues.push(\"Inventory variance unavailable: required stock inputs missing\");\n\n  let nextCheck = \"Review the source record and confirm the transaction details.\";\n  if (inventoryAlert) {\n    nextCheck = \"Verify physical stock count, goods received, sales, returns and supplier-return records.\";\n  } else if (discountAlert) {\n    nextCheck = \"Check discount authorisation and the promotion or transaction record.\";\n  } else if (returnsAlert) {\n    nextCheck = \"Verify returned units and confirm that restocked units were physically returned to inventory.\";\n  }\n\n  const summary = alerts.length\n    ? `Review requested: ${alerts.join(\", \")}. This is a rule-based flag, not proof of fraud.`\n    : \"No configured alert rule was triggered. This does not guarantee the record is error-free.\";\n\n  return {\n    json: {\n      ...r,\n      \"Data Status\": validationIssues.length ? \"REVIEW_DATA\" : \"VALIDATED_FOR_RULES\",\n      \"Validation Issues\": validationIssues.join(\"; \"),\n      \"Expected Closing Stock (Calculated)\": expectedClosing,\n      \"Inventory Variance (Calculated)\": variance,\n      \"Inventory Alert\": inventoryAlert,\n      \"Discount Alert\": discountAlert,\n      \"Returns Alert\": returnsAlert,\n      \"Alert Types\": alerts.join(\", \"),\n      \"Review Priority\": alerts.length ? \"Review Required\" : \"No Rule Triggered\",\n      \"Investigation Summary\": summary,\n      \"Recommended Next Check\": nextCheck,\n      \"Data Provenance\": \"Source fields retained; synthetic movement fields are demonstration data\"\n    }\n  };\n});\n"
      },
      "id": "b2eeaccd-099f-49a7-b6a1-d27b22a4fcc2",
      "name": "Code in JavaScript",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        640,
        128
      ]
    },
    {
      "parameters": {
        "authentication": "oAuth2",
        "projectRef": "rebbmrgidrplibspwjmt",
        "tableId": "retailguard_cases",
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldId": "case_id",
              "fieldValue": "={{ $json[\"Case ID\"] }}"
            },
            {
              "fieldId": "case_date",
              "fieldValue": "={{ $json[\"Date\"] }}"
            },
            {
              "fieldId": "=store_id",
              "fieldValue": "={{ $json[\"Store ID\"] }}"
            },
            {
              "fieldId": "=product_id",
              "fieldValue": "={{ $json[\"Product ID\"] }}"
            },
            {
              "fieldId": "category",
              "fieldValue": "={{ $json[\"Category\"] }}"
            },
            {
              "fieldId": "source_inventory_level",
              "fieldValue": "={{ $json[\"Source Inventory Level (meaning to verify)\"] }}"
            },
            {
              "fieldId": "units_sold",
              "fieldValue": "={{ $json[\"Source Units Sold\"] }}"
            },
            {
              "fieldId": "units_ordered",
              "fieldValue": "={{ $json[\"Source Units Ordered (not assumed received)\"] }}"
            },
            {
              "fieldId": "discount_percent",
              "fieldValue": "={{ $json[\"Source Discount (%)\"] }}"
            },
            {
              "fieldId": "demand",
              "fieldValue": "={{ $json[\"Source Demand\"] }}"
            },
            {
              "fieldId": "expected_closing_stock",
              "fieldValue": "={{ $json[\"Expected Closing Stock (calculated)\"] }}"
            },
            {
              "fieldId": "synthetic_actual_closing_stock",
              "fieldValue": "={{ $json[\"Synthetic Actual Closing Stock\"] }}"
            },
            {
              "fieldId": "inventory_variance",
              "fieldValue": "={{ $json[\"Inventory Variance (actual - expected)\"] }}"
            },
            {
              "fieldId": "source_inventory_level",
              "fieldValue": "={{ $json[\"Source Inventory Level (meaning to verify)\"] }}"
            },
            {
              "fieldId": "units_sold",
              "fieldValue": "={{ $json[\"Source Units Sold\"] }}"
            },
            {
              "fieldId": "units_ordered",
              "fieldValue": "={{ $json[\"Source Units Ordered (not assumed received)\"] }}"
            },
            {
              "fieldId": "discount_percent",
              "fieldValue": "={{ $json[\"Source Discount (%)\"] }}"
            },
            {
              "fieldId": "demand",
              "fieldValue": "={{ $json[\"Source Demand\"] }}"
            },
            {
              "fieldId": "expected_closing_stock",
              "fieldValue": "={{ $json[\"Expected Closing Stock (calculated)\"] }}"
            }
          ]
        }
      },
      "id": "c0aa38c3-1349-4d38-b101-8d2326b85ab7",
      "name": "Create a row",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [
        880,
        0
      ],
      "disabled": true
    },
    {
      "parameters": {
        "jsCode": "\nconst rows = $input.all().map(item => item.json);\n\nconst count = (field) =>\n  rows.filter(row => row[field] === true).length;\n\nreturn [{\n  json: {\n    totalRecords: rows.length,\n    inventoryAlerts: count(\"Inventory Alert\"),\n    discountAlerts: count(\"Discount Alert\"),\n    returnsAlerts: count(\"Returns Alert\"),\n    recordsRequiringReview: rows.filter(\n      row => row[\"Review Priority\"] === \"Review Required\"\n    ).length,\n    recordsWithValidationIssues: rows.filter(\n      row => row[\"Validation Issues\"]\n    ).length\n  }\n}];\n"
      },
      "id": "25bcb8ad-9b37-4153-b6a9-72363208deba",
      "name": "Summary Node",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        880,
        256
      ]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://retailguardai.lovable.app/api/public/receive-summary",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "totalRecords",
              "value": "={{ $json.totalRecords }}"
            },
            {
              "name": "inventoryAlerts",
              "value": "={{ $json.inventoryAlerts }}"
            },
            {
              "name": "discountAlerts",
              "value": "={{ $json.discountAlerts }}"
            },
            {
              "name": "returnsAlerts",
              "value": "={{ $json.returnsAlerts }}"
            },
            {
              "name": "recordsRequiringReview",
              "value": "={{ $json.recordsRequiringReview }}"
            },
            {
              "name": "recordsWithValidationIssues",
              "value": "={{ $json.recordsWithValidationIssues }}"
            }
          ]
        },
        "options": {}
      },
      "id": "19580f3a-6668-458d-8be6-9c03d0cb5980",
      "name": "HTTP Request1",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.5,
      "position": [
        1008,
        256
      ],
      "credentials": {
        "httpHeaderAuth": {
          "id": "z9FQbX2IRF5P3rvg",
          "name": "Header Auth account"
        }
      }
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ JSON.stringify($(\"Summary Node\").first().json) }}",
        "options": {}
      },
      "id": "62fe21e3-38de-499d-9268-4277cdad7a26",
      "name": "Respond to Website",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.5,
      "position": [
        1328,
        224
      ]
    }
  ],
  "pinData": {},
  "connections": {
    "Website Refresh Webhook": {
      "main": [
        [
          {
            "node": "HTTP Request",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "HTTP Request": {
      "main": [
        [
          {
            "node": "Extract from File1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "RetailGuard AI - Inventory Investigation": {
      "main": [
        [
          {
            "node": "HTTP Request",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Extract from File1": {
      "main": [
        [
          {
            "node": "Code in JavaScript",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Code in JavaScript": {
      "main": [
        [
          {
            "node": "Create a row",
            "type": "main",
            "index": 0
          },
          {
            "node": "Summary Node",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Summary Node": {
      "main": [
        [
          {
            "node": "HTTP Request1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "HTTP Request1": {
      "main": [
        [
          {
            "node": "Respond to Website",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": false,
  "settings": {
    "executionOrder": "v1",
    "binaryMode": "separate"
  },
  "versionId": "aaf76d2b-eee3-4096-aea5-43f401c848a4",
  "meta": {
    "instanceId": "75f10fa91f9b13808c733470d66c3ccbff1058c7564df43b2b893ac489f93b92"
  },
  "nodeGroups": [],
  "id": "B1btG6K8JCs6cI98",
  "tags": []
}validates it, calculates expected vs. actual stock, detects anomalies, and generates AI explanations.
2. **The Sender (n8n HTTP Node)**: Once analysis is complete, n8n packages the KPI summary and POSTs the JSON payload directly to the frontend's API endpoint.
3. **The Gatekeeper (Lovable / TanStack Start)**: The Lovable application acts as both the frontend and backend. The `/api/public/receive-summary` endpoint securely receives the payload, verifies the API key using constant-time equality, and validates the schema.
4. **The Vault (Database)**: Validated payloads are written to the `retailguard_summary` table. Row Level Security (RLS) ensures only authenticated dashboard users can read the operational data.
5. **The Dashboard (React)**: The frontend auto-refreshes to display the latest KPIs, global anomaly radar, and interactive store maps.

## ✨ Features

* **Strict Dark Mode UI**: Deep charcoal backgrounds with neon teal/cyan primary actions and semantic status colors.
* **Live KPI Overview**: Tracks total records analyzed, active alerts, high-priority cases, and discrepancy values.
* **AI Investigations**: Displays AI-generated reasoning, evidence, and recommended verification steps for flagged stock anomalies.
* **Split-Screen Case Explorer**: A filterable data table paired with a dark-themed interactive map for store-level intelligence.
* **Secure Webhook Receiver**: Built-in backend endpoint that rejects unauthorized payloads and protects data via RLS.

## 🛠 Tech Stack

* **Frontend & API**: [Lovable Cloud](https://lovable.dev/) / TanStack Start (React)
* **Automation & AI Pipeline**: [n8n](https://n8n.io/)
* **Database**: Supabase (PostgreSQL with Row Level Security)
* **Mapping**: Mapbox / Leaflet (Dark Tile Layer)

## 🔄 n8n Workflow

*(Replace the image below with your actual n8n workflow screenshot)*

![RetailGuard AI n8n Workflow](./path/to/your/n8n-workflow-screenshot.png)

### Workflow Steps:
1. **Fetch**: Retrieve source inventory file (e.g., from GitHub).
2. **Validate & Calculate**: Compute expected stock vs. actual physical stock.
3. **Analyze**: Apply rule-based alerts (Inventory Variance, Discount >= 20%, Returns >= 4 units).
4. **AI Generation**: Generate human-readable investigation notes and next steps.
5. **Summarize & Push**: An HTTP Request node POSTs the final metrics to the Lovable dashboard.

## 🚀 Setup & Configuration

### 1. Lovable Backend Configuration
The Lovable app requires a secret key to authenticate incoming payloads from n8n.
1. Generate a strong, random 32-character string (e.g., using `openssl rand -hex 16`).
2. In your Lovable project settings, add a new Environment Variable:
   * **Key**: `N8N_SUMMARY_SECRET`
   * **Value**: `<your-generated-secret>`
3. Deploy the application to activate the endpoint.

### 2. n8n Sender Configuration
Configure the final **HTTP Request** node in your n8n workflow to push data to Lovable.

* **Method**: `POST`
* **URL**: `https://<your-lovable-project-id>.lovable.app/api/public/receive-summary`
* **Authentication**: Generic Credential Type → Header Auth
* **Credential Setup**: 
  * **Name**: `x-api-key`
  * **Value**: `<your-generated-secret>` (Must exactly match `N8N_SUMMARY_SECRET`)
* **Body Content Type**: `JSON`
* **Body**: `{{ $json }}` 

*Required JSON Schema for the body:*
```json
{
  "totalRecords": 750,
  "inventoryAlerts": 80,
  "discountAlerts": 131,
  "returnsAlerts": 245,
  "recordsRequiringReview": 379,
  "recordsWithValidationIssues": 32
}<img width="1024" height="555" alt="PHOTO-2026-11-14-11-36-02" src="https://github.com/user-attachments/assets/1f5e905d-c704-4113-8cb4-7be35d7d273c" />





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


# RetailGuardAi

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
