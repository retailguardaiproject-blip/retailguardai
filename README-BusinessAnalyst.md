# RetailGuard AI
**PRODUCT REQUIREMENTS DOCUMENT  |  GENAI HACKATHON**
From Inventory Loss to Investigation Intelligence
Working draft for team review • 19 October 2026
Document control
Field	Details
Project	RetailGuard AI
Hackathon theme	Theme 4 — Finance, Fraud Detection & Risk Intelligence
Official topic alignment	Aura Retail — Inventory Leakage / Fraud Detection
Domain	Retail operations, inventory controls, anomaly detection and investigation support
Team	Soubhagya Halgeri, Anju Abhilash, Logeshwari, Triveni G, Nagashree V (5 members)
Product owner / PRD coordinator	Soubhagya Halgeri — proposed
Version / status	v0.1 • Draft for team validation (not approved)
Source template	ScamShield AI PRD shared by user (10-section format)
Basis	RetailGuard poster, previous team discussions, starter-package scope and proposed roadmap

**1. Executive summary**
RetailGuard AI is a proposed decision-support tool for retail managers who need to identify unusual inventory, return and discount patterns without manually inspecting every transaction. The MVP will ingest synthetic retail data, validate inputs, calculate explainable anomaly indicators, prioritise review cases and use a large language model (LLM) to produce evidence-grounded investigation briefs. A manager remains responsible for interpreting findings and closing cases.
The initial delivery approach is Python + Pandas for deterministic calculations, Streamlit for the interface, a single LLM API for investigation briefs, GitHub for collaboration and a simple prototype deployment. The team should first prove a working inventory variance flow before adding returns, discounts and GenAI.

**2. Problem statement and opportunity**
Area	RetailGuard-specific definition
Problem	Retail operations teams face high volumes of stock movements, sales, returns and discounts; manually identifying significant exceptions and deciding what to check next can be slow.
Evidence available	The poster provides an illustrative Store S3 scenario. No verified retailer baseline, loss amount or pilot study has been supplied; all numerical examples must be labelled synthetic or illustrative.
Current alternatives	Spreadsheets, stock reconciliation reports, POS summaries, rule alerts and manual investigation.
Gap	Basic reports show exceptions but may not combine supporting records, distinguish uncertainty and recommend traceable next checks in plain language.
Opportunity	Prioritise the most relevant cases and produce structured, evidence-linked investigation briefs for a manager to review.

**3. Goals, non-goals and success metrics**
Type	Proposed requirement	Validation / measure
Product goal	Detect and display inventory shortage exceptions based on agreed rules.	Expected results match manually verified synthetic reference cases.
GenAI goal	Produce an investigation brief grounded in supplied case data.	Review 20 sample briefs for correct numbers, traceable evidence and appropriate uncertainty (proposed evaluation set).
Usability goal	A manager can upload a file, locate a flagged case and understand next checks.	3–5 walkthroughs if participants are available; record issues rather than claiming satisfaction scores.
Engineering goal	Complete upload → validation → variance → prioritisation → case review.	Demonstrate end-to-end on a clean synthetic dataset.
QA goal	Handle malformed inputs and avoid silent wrong calculations.	Proposed 30 functional/negative tests, including invalid rows.
Non-goal	Proving fraud, accusing employees or automatically penalising anyone.	No autonomous adverse actions.
Non-goal	Live POS integration, real-time surveillance, multi-cloud architecture or production-scale deployment.	Deferred beyond hackathon MVP.
Non-goal	Guaranteed reductions in fraud, losses or review time.	Requires later baseline and pilot measurement.

Important: poster impact figures such as ≥65%, ≤15 minutes or ≥70% were not demonstrated results and must not be presented as achieved KPIs. Replace them with measured pilot results only when available.

**4. Users, personas and use cases**
Primary persona (hypothetical): Store Operations Manager — supervises inventory accuracy and investigates exceptions across stores; needs a ranked list of cases and clear evidence without reviewing every line item.
Secondary persona (hypothetical): Retail Loss Prevention / Internal Audit Analyst — reviews unusual return and discount activity and documents investigation outcomes.
Hero use case — Store S3 (illustrative)
A manager uploads a synthetic retail dataset. The system identifies Store S3 as requiring review based on inventory variance, with related return and discount indicators available as context. The dashboard shows the calculation and source rows; an AI-generated brief explains what is unusual, what is not yet known and which records to verify. The manager marks the case Open, In Review or Closed with a note. An anomaly is never labelled confirmed fraud.
Three MVP user stories
ID / story	Acceptance criteria
US-01 — Upload and validate data
As a retail operations manager, I want to upload a CSV so I can review stock exceptions.	Given a valid CSV with required columns, show uploaded rows and validation summary. Missing columns, duplicate identifiers, nonnumeric counts or invalid negative values are flagged; affected rows are not silently processed.
US-02 — Calculate and prioritise variances
As a manager, I want expected stock and shortages calculated so I can identify records needing review.	For each valid record, expected closing stock = opening + receipts + restocked returns − sales − authorised adjustments; shortage = expected − physical count; shortage % = shortage / expected × 100 when expected > 0. Apply the agreed review threshold and show calculation components.
US-03 — Review investigation brief
As a manager, I want an evidence-based explanation and suggested checks so I can decide what to investigate.	The brief cites case ID and actual input values; distinguishes observation from hypothesis; lists missing evidence and suggested next checks; never asserts theft or fraud; allows human review/status update.

**5. Domain context and data**
Glossary
Term	Meaning
Expected closing stock	Book quantity after all modelled stock movements.
Physical count	Observed quantity from stocktake.
Shortage / variance	Difference between expected and physical quantity; sign convention must be shown.
Shrinkage	Unexplained inventory loss; requires careful accounting for legitimate movements.
Return rate	Returns relative to a defined denominator and period; definition must be agreed.
Discount rate	Discount value relative to an agreed original or gross price basis.
Anomaly	Unusual pattern requiring review; not proof of misconduct.
Investigation brief	Structured explanation of observed evidence, uncertainties and suggested checks.

**Minimum inventory data dictionary**

Field	Type / constraint	Use
record_id	Unique text, required	Traceability
store_id, product_id	Text, required	Grouping
period_end	Date, required	Time reference
opening_stock	Non-negative integer	Expected stock
receipts	Non-negative integer	Expected stock
restocked_returns	Non-negative integer	Expected stock
units_sold	Non-negative integer	Expected stock
authorised_adjustments	Signed or non-negative integer per agreed convention	Expected stock
physical_count	Non-negative integer	Variance
unit_cost	Non-negative number, optional	Estimated exposure; not validated loss

Sample-data basis from the prior starter package: 14 synthetic inventory records across five stores, an expected-results CSV and deliberately invalid test rows. The team should verify that the actual file columns match this PRD before implementing the parser. The poster’s Store S3 rates (8.7%, 14.2%, 21.0%, 2.1%) are illustrative and are not automatically derived from the starter inventory CSV.

**Inventory business rules — proposed**

•	BR-01: Validate schema, uniqueness, numeric types and non-negative quantities before calculations.
•	BR-02: Expected stock = opening stock + receipts + restocked returns − units sold − authorised stock reductions; define how other signed adjustments are represented.
•	BR-03: Shortage units = expected stock − physical count; positive values indicate shortage, negative values indicate surplus.
•	BR-04: If expected stock > 0, shortage percentage = 100 × shortage units / expected stock. For expected stock = 0, mark the percentage N/A and flag inconsistent positive counts separately.
•	BR-05: An illustrative shortage review threshold of >3% may be used for the starter exercise; confirm exact threshold, rounding and whether it applies only to positive shortages before sign-off.
•	BR-06: Do not calculate return/discount anomaly rates until denominators, time windows, comparison groups and thresholds are explicitly defined.
•	BR-07: Every flagged case must retain source record IDs and the underlying calculation.

**6. Solution overview and why GenAI**

Proposed workflow: Upload CSV → validate data → calculate inventory variance / later return and discount indicators → apply explainable prioritisation → generate structured AI investigation brief → manager review and case status update.
Use Python for calculations and rules. Use the LLM only to transform verified case evidence into an accessible narrative, identify missing information and recommend non-accusatory checks. A simpler rules engine can detect numerical anomalies; GenAI adds value primarily in communicating multi-record context and next steps.
Investigation brief output contract — proposed
Field	Expected content
case_id / store_id	Traceable identifiers
anomaly_type / priority	Calculated category and rule-based priority
observed_evidence	Specific source figures and comparison baseline
explanation	Plain-language description limited to provided data
unknowns	What cannot be concluded from the evidence
recommended_checks	Review stock adjustments, return reasons, approvals and comparable stores where applicable
review_status	Open / In Review / Closed; managed by user, not LLM

Failure handling: if LLM is unavailable, show deterministic calculation and a rules-based template summary; never hide the case or invent a narrative.

**7. Strategy lanes and team ownership**

Member	Primary lane	Deliverables	Supporting lane
Soubhagya Halgeri	Business / product lead	PRD, rules, user stories, acceptance criteria, scope and demo narrative	UAT and stakeholder decisions
Anju Abhilash	Data & analytics	Synthetic data, Pandas cleaning, variance logic, reference results and charts	LLM evidence payload
Logeshwari	Application & deployment	Streamlit UI, GitHub integration, LLM API integration, secrets and demo deployment	Automation and error handling
Triveni G	QA & AI evaluation	Test plan, invalid-input cases, calculation assertions, AI brief evaluation and defect log	Regression / release readiness
Nagashree V	User research & adoption	Persona review, usability questions, walkthrough notes, user guidance and presentation coordination	Documentation and feedback

Capacity caveat: Anju has learned Python but is not yet advanced; Logeshwari can write small programs and automation scripts. Assign a first joint integration task before committing to advanced features. All roles are proposed until the team confirms.

**8. Tooling and technology choices**

Need	Proposed choice	Reason	Limitation / fallback
Input	CSV / Excel export	Simple and inspectable	CSV only for first build
Processing	Python + Pandas	Transparent calculations	Use plain Python for small data if needed
Anomaly rules	Deterministic Python rules	Explainable, testable	Defer machine learning
UI / charts	Streamlit; optional Plotly	Fast Python web prototype	Built-in Streamlit charts first
GenAI	One selected LLM API; JSON schema / Pydantic validation	Structured investigation brief	Rules-based template if unavailable
Storage	CSV in prototype; optional SQLite later	Low setup cost	Avoid real customer data
Tests	Pytest + manual review	Automated calculations and edge cases	Manual reference sheet
Collaboration	GitHub	Shared code, issues and review	Repository access and learning needed
Deployment	Streamlit Community Cloud (proposed)	Convenient demo deployment	Local demo / screen recording backup

Open decision: Select an LLM provider/model after confirming access, pricing, data handling and available API credentials. Do not put API keys in source code or uploaded CSV files.

**9. Responsible AI, reliability and safety**

•	No fraud verdicts: use “flagged for review”, “possible explanation” and “requires verification”.
•	Grounding: AI may only use validated structured case data; display numeric source evidence and IDs.
•	No fabricated numbers, causal claims or certainty scores without a validated method.
•	Privacy: use synthetic or authorised de-identified data; minimise retention and avoid personal employee allegations.
•	Human oversight: manager decides case outcome; AI suggestions are advisory only.
•	Quality evaluation: proposed 20 sample briefs covering factual accuracy, omissions, uncertainty, relevance and safe language.
•	Input resilience: validate CSV data; treat uploaded free text as untrusted; prevent it from overriding system instructions.
•	Access and cost controls: secrets management, restricted deployment where possible, bounded LLM requests and fallback output.

**10. Risks, dependencies and mitigations**

Risk / dependency	Assessment	Mitigation	Owner
Python / Streamlit learning curve	Medium likelihood; schedule impact	Start with one CSV and one calculation; pair Anju and Logeshwari	Anju + Logeshwari
Unclear stock adjustment semantics	High correctness impact	Approve data dictionary and example calculations before coding	Soubhagya + Anju
Synthetic data does not reflect real operations	Medium validation impact	Label as synthetic; seek later domain feedback	Soubhagya + Nagashree
LLM hallucinates causes or numbers	High trust impact	Constrain inputs/output, source-link numbers, test and require review	Triveni + Logeshwari
No real-world performance baseline	High claim risk	Treat impact numbers as hypotheses, not achieved outcomes	Soubhagya
API cost / network or deployment failure	Medium demo impact	Limit requests; prepare deterministic fallback and local demo	Logeshwari
Scope creep (live integrations, fraud scoring)	High schedule impact	Freeze first milestone and maintain deferred backlog	Soubhagya

**Implementation roadmap — proposed four weeks**

Week	Main objective	Team output / exit gate
Week 1	Requirements and data foundation	Approved fields, 3 user stories, rule definitions, sample CSV and reference expected results.
Week 2	Deterministic analytics prototype	CSV upload, validation, expected-stock and variance calculations, flagged cases in Streamlit.
Week 3	GenAI explanation and case workflow	Evidence-grounded investigation brief, case prioritisation and manager status controls.
Week 4	Testing, deployment and demo	QA execution, critical fixes, deployed/local backup and rehearsed demonstration.

**Immediate first three-day handoff**

•	Day 1 — Soubhagya and Anju approve schema, formula and three worked examples; Logeshwari creates repo/app skeleton.
•	Day 2 — Anju writes and verifies calculation script; Triveni prepares valid/invalid test cases; Nagashree sketches manager view.
•	Day 3 — Logeshwari integrates CSV upload and calculation display; team runs a review and logs defects.
Open questions and sign-off checklist
•	Confirm actual starter CSV column names and adjustment sign convention.
•	Approve inventory review threshold and priority rules.
•	Define return and discount indicators only after confirming data availability.
•	Choose LLM provider, budget and whether online deployment is permitted.
•	Confirm next hackathon stage deadline and demo time limit.
•	Confirm ownership, test targets and definition of done with all five members.
Approval status: Pending team review. No claims in this document imply that development, testing or pilot validation have already been completed.
