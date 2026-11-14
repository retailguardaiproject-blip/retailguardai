# RetailGuard AI
[For LogeshwariRetailGuardAI_Inventory Investigation_original.json](https://github.com/user-attachments/files/34842247/For.LogeshwariRetailGuardAI_Inventory.Investigation_original.json)


# RetailGuard AI

RetailGuard AI is an inventory anomaly and fraud detection dashboard. It transforms raw retail data into prioritized, evidence-backed cases for human review using an AI-powered pipeline, presenting the insights on a high-density, dark-themed analytics interface.

## 🏗 Architecture Overview (Push Model)

RetailGuard AI utilizes a "Push" architecture to seamlessly deliver long-running AI analysis from an automation backend to a secure frontend.

1. **The Pipeline (n8n)**: An n8n workflow fetches inventory source data, validates it, calculates expected vs. actual stock, detects anomalies, and generates AI explanations.
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

<img width="1024" height="555" alt="PHOTO-2026-11-14-11-36-02" src="https://github.com/user-attachments/assets/c8b91ff8-6c4f-4178-a131-285a442a0042" />

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
}

