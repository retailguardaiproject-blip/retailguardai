# RetailGuard AI – Inventory Investigation (E2E & UI Testing)

An end-to-end n8n workflow that downloads retail case data, checks each record against
inventory, discount and returns rules, publishes the results, captures a UI screenshot,
and emails a pass/fail run report.

## What it does
1. **Fetch data**: downloads `retailguard_cases.xlsx` from this repository.
2. **Extract records**: turns the Excel sheet into one record per case.
3. **Apply rules** (JavaScript):
   - Expected closing stock = opening + purchases received + customer returns restocked
     − units sold − supplier returns
   - Inventory variance = actual closing stock − expected closing stock
   - Alerts:
     - Inventory variance alert when |variance| ≥ 5 units
     - Discount alert when discount ≥ 20%
     - Returns alert when customer returns ≥ 4 units
   - Data quality checks: missing IDs, duplicate Case IDs, missing stock values
4. **Summarize**: counts total records, alerts by type, records needing review and
   validation issues.
5. **Publish**: sends the results to the RetailGuard AI web app (Lovable).
6. **Verify UI**: takes a full-page screenshot with a headless browser (Browserless).
7. **Report**: emails an HTML run report through Gmail:
   - **SUCCESS**: step results, totals and the screenshot attached
   - **FAILED**: the failed step and its error details

## Error handling
Every data step (download, extract, rules, summary) has an error branch that goes to the
report step, so a failed run still sends an email naming the failed step.
The publish and UI check steps continue on error and show their status in the report.

## Sample run (demo dataset)
| Metric | Value |
|---|---|
| Total records | 750 |
| Inventory alerts | 80 |
| Discount alerts | 131 |
| Returns alerts | 245 |
| Records requiring review | 379 |
| Records with validation issues | 0 |

## Tech stack
n8n · JavaScript · GitHub (data source) · Browserless (headless browser) · Gmail API · Lovable

## Setup
1. Import the workflow JSON into n8n.
2. Create the credentials:
   - **Browserless API token** (stored as a credential, never in the URL)
   - **Gmail OAuth2**
3. Set the report recipient in the **Email Run Report** node.
4. Run it manually from the editor.

## Notes
- The stock movement fields are **synthetic demo data**, labelled as such in the dataset.
- Rule thresholds are illustrative and easy to change in the rules node.

# RetailGuard AI – Run All Test Scenarios

An automated n8n test suite that checks the RetailGuard rules engine against
known datasets and reports PASS/FAIL for every test case.

## What it does
1. **Define suites**: three test datasets (CSV files in this repository):
   | Suite | File | Expected behaviour |
   |---|---|---|
   | Good | `test_good.csv` | No alerts; status `VALIDATED_FOR_RULES` |
   | Bad (Negative) | `Negative_Test_Cases.csv` | Invalid records are flagged `REVIEW_DATA`; anomalous records match the expected alert flags |
   | Anomaly | `test_anomaly.csv` | At least one alert is raised |
2. **Download**: fetches each suite's CSV.
3. **Apply rules**: runs the same rules as the main pipeline (inventory variance,
   discount ≥ 20%, returns ≥ 4 units, plus data quality checks).
4. **Check expected vs actual**: compares each case with its expected result
   and marks it **PASS** or **FAIL**.
5. **Build report**: gives an overall result (`ALL PASSED` / `FAILURES FOUND`),
   pass/fail counts per suite, and a list of failed cases.

## Output
- `overallResult`: `ALL PASSED` or `FAILURES FOUND`
- `totalTests`, `passed`, `failed`
- `suites`: total, passed and failed per suite
- `failedCases`: suite, Case ID, expected, actual
- `allResults`: the full result table

## Why it matters
- **Positive testing**: clean data must not raise false alarms.
- **Negative testing**: bad or incomplete data must be caught, not silently processed.
- **Anomaly testing**: real problems must trigger the right alerts.

## Tech stack
n8n · JavaScript · GitHub (test data)

## Setup
1. Import the workflow JSON into n8n.
2. No credentials are needed (the test files are public on GitHub).
3. Run it manually and open the **Build Test Report** node to see the results.


