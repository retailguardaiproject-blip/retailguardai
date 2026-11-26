## 👥 Team Contributions & KRA Sheet

| Member | Designation | Key Result Area (KRA) | Key Deliverables | Evidence (Final Video Time) | Rubric Parameter |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Soubhagya Halgeri** | Business / Product Lead (TL) | Problem definition & PRD | Wrote the PRD: problem, target users, goals and MVP scope for Theme 4 | Deck 0:00–1:55; PRD | Problem Impact & Relevance |
| **Soubhagya Halgeri** | Business / Product Lead (TL) | Business rules & requirements | 3 user stories with acceptance criteria; business rules BR-01 to BR-07 | Rules node 2:03–4:13; PRD | Technical Execution & Feasibility |
| **Soubhagya Halgeri** | Business / Product Lead (TL) | Demo narrative & team lead | Roadmap and team lanes; 12-slide deck; 7-minute video storyline | Deck 0:00–1:55; intro and closing | Pitch, Presentation & Q&A |
| **Soubhagya Halgeri** | Business / Product Lead (TL) | Responsible AI & UAT | AI guardrails (no fraud verdicts, human review); risk register; UAT and quick wins | Next steps slide 1:47; PRD | Innovation & Originality |
| **Anju Abhilash** | Data Analyst | Dataset & data quality | Structured the 750-record dataset; labelled synthetic fields and data limits | Data workflow 2:03–4:13; AIA deck | Technical Execution & Feasibility |
| **Anju Abhilash** | Data Analyst | n8n data workflow | Built 5-node flow: GitHub fetch → Excel parse → rules → KPI summary | n8n workflow run 2:03–4:13 | Technical Execution & Feasibility |
| **Anju Abhilash** | Data Analyst | Variance & alert rules | Variance = actual − expected; alerts for stock gaps, discounts ≥20%, high returns | JavaScript rules node 2:03–4:13 | Innovation & Originality |
| **Anju Abhilash** | Data Analyst | KPI outputs & briefing | 750 records → 379 alerts, 32 high-priority; presented manager briefing at AIA demo | KPI summary 2:03–4:13; dashboard 4:46 | Pitch, Presentation & Q&A |
| **Logeshwari** | Application & Integration | n8n → dashboard integration | Authenticated API POST sends KPI summary from n8n to the live Lovable app | Lovable node 4:23–4:46; workflow JSON | Technical Execution & Feasibility |
| **Logeshwari** | Application & Integration | Data validation checks | Flags duplicate case IDs, missing identity fields and missing stock inputs | Rules node 4:23–4:46; workflow JSON | Technical Execution & Feasibility |
| **Logeshwari** | Application & Integration | Investigation summary & next check | Per-record summary and recommended next check; flags framed as review signals, not fraud | Dashboard summary 4:46–5:17 | Innovation & Originality |
| **Logeshwari** | Application & Integration | Dashboard deployment & secure setup | Deployed the dashboard from Lovable to Vercel; API key kept in n8n credentials, not in code | Live dashboard 4:46–5:17 | Design, Usability & UX |
| **Triveni G** | QA Automation Engineer | Test data & test cases | Built good-case, anomaly and bad-case (negative) tests from a 750-row dataset on GitHub; bad case fails as designed | Test cases workflow 5:19–5:39; QA deck | Technical Execution & Feasibility |
| **Triveni G** | QA Automation Engineer | E2E test pipeline (n8n) | 9-node flow: GitHub fetch → JS sanitise & batch → POST to app → wait → UI checks | E2E & UI workflow 5:47–6:32 | Technical Execution & Feasibility |
| **Triveni G** | QA Automation Engineer | Headless UI validation | Browserless + Puppeteer tests filters, Case Explorer, Store Intelligence and multi-account login | UI test node 5:47–6:32; QA deck | Design, Usability & UX |
| **Triveni G** | QA Automation Engineer | Reliability & release readiness | Fixed async race conditions (Wait node) and API rate limits (batching); one-click regression | E2E run 5:47–6:32; QA deck | Technical Execution & Feasibility |

## 📊 Rubric Coverage

| Rubric Parameter | Weight | How RetailGuard AI Addresses It | Owners | Final Video Time |
| :--- | :---: | :--- | :--- | :--- |
| **Problem Impact & Relevance** | 25% | Theme 4 (Fraud Detection & Risk): stock variances hide inventory loss; clear users (store operations managers, loss prevention analysts); 750 records narrowed to 32 high-priority cases | Soubhagya Halgeri | 0:00–1:55 (deck) |
| **Technical Execution & Feasibility** | 25% | Working MVP: n8n pipeline (GitHub data → Excel parse → JS rules → KPI summary → secured push to app), live dashboard on Vercel, automated E2E and UI tests | Anju Abhilash, Logeshwari, Triveni G | 2:03–4:13 data workflow; 4:23–4:46 integration; 5:19–6:32 testing |
| **Innovation & Originality** | 20% | Per-case investigation summary and recommended next check; explainable rule-based alerts; guardrails so flags are review signals, not fraud verdicts | Anju Abhilash, Logeshwari, Soubhagya Halgeri | 0:00–1:55 (variance and AI summary slides); 4:46–5:17 (dashboard) |
| **Design, Usability & UX** | 15% | Clean dashboard: Overview KPIs, Case Explorer filters, Store Intelligence, Access Review; UI verified by automated Browserless/Puppeteer tests | Logeshwari, Triveni G | 4:46–5:17 dashboard; 5:47–6:32 UI tests |
| **Pitch, Presentation & Q&A** | 15% | Planning → Demo → AI concepts → Execution storyline within 7 minutes; each contributor presents their own work | Soubhagya Halgeri (with all 4 members) | 0:00–6:41 (full video) |
| **Total** | **100%** | | | |
