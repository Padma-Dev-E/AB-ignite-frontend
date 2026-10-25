# Sample Idea Submission — High AI Score Target

Use this sample to exercise a well-defined idea that is intended to score above **8/10** in AI validation. Gemini scores can vary between runs, so the content is designed for that outcome but cannot guarantee an exact score.

## Step 1 — Describe

- **Type:** An idea
- **Your idea in your own words:**

  Corporate Payment Operations staff currently investigate reconciliation exceptions by switching between payment status, settlement, and exception records. This slows resolution and makes it harder to identify which cases need attention first. I propose a read-only work queue that brings the relevant exception details together, groups likely duplicates, and sorts cases using transparent rules. Staff would review each case and decide what action to take; the tool would not release, amend, or reject payments. Start with one operations team and a limited set of exception types, then compare handling time and accuracy with the existing process before considering expansion.

- **Potentially related ideas:** Search results depend on existing submissions. If a genuinely related idea appears, select it and enter the distinction below. Do not select an unrelated idea just to continue.
- **How is your idea different?** *(Only required if related ideas are shown and none is selected.)*

  This proposal is limited to read-only triage of corporate payment reconciliation exceptions. It does not change payment instructions or automate settlement decisions.

## Step 2 — Develop

- **Idea title:** Read-Only Triage Queue for Corporate Payment Reconciliation Exceptions
- **Summary:** Give Corporate Payment Operations a single read-only queue for investigating reconciliation exceptions. Group likely duplicate records, show the relevant payment and settlement status, and order cases using documented rules. Staff retain control of every decision. Test a small pilot against current handling time, backlog age, and accuracy before any expansion.
- **Problem statement:** Operations staff investigate reconciliation exceptions using information spread across several views. The repeated lookups add handling time, make prioritization inconsistent, and can delay identifying exceptions that need a specialist. The size of the opportunity should be confirmed from a baseline before rollout.
- **Proposed solution:** Build a role-restricted, read-only queue for an agreed set of corporate payment exception types. Display the source references and status fields used for each case, flag possible duplicates without merging records, and sort cases with documented rules. Require staff to open the source record and make any permitted change through existing systems and approval controls. Pilot with one team and review access, audit, and operational controls before expansion.
- **Expected benefits:** Reduce time spent switching between screens; help staff find older or higher-priority cases sooner; provide a consistent view for handoffs; and make exception handling easier to measure. Confirm benefits using a pre-pilot baseline and a time-limited pilot.
- **Possible risks:** Incorrect or stale source data could mislead staff; duplicate flags could hide distinct cases; a new queue could expose payment information to users without a business need; and staff could over-rely on sorting rules. Mitigate with source links and timestamps, no automatic record merging or payment actions, role-based access, audit logging, a documented rule set, and staff review.

## Step 3 — Questions reviewers may ask

- **Who experiences this problem today?** Corporate Payment Operations staff who investigate reconciliation exceptions. Corporate clients may be affected when an exception takes longer to resolve, but the pilot should first measure the internal workflow.
- **What happens today?** Staff locate an exception, check its payment and settlement status in separate views, compare related records, and decide whether to investigate further or refer it to a specialist. The exact baseline volumes and handling times should be measured during discovery.
- **What is needed to make this work?** Agreement on the pilot team and exception types; approved read-only access to the required source fields; a named process owner; information-security and data-access review; documented sorting and duplicate-flag rules; audit logging; and a way to compare pilot outcomes with the current process.
- **What could make the proposal difficult?** Source systems may use different identifiers or update at different times. False duplicate flags, incomplete permissions, or unclear ownership could reduce trust. Keep the first release read-only, show source and update time, test against reviewed examples, and provide a clear escalation path.
- **How would you know the change worked?** Compare median handling time and age of open exceptions with a pre-pilot baseline; measure duplicate-flag precision using staff-reviewed samples; track rework and escalations; and verify there are no unauthorized payment actions or access-control incidents. Set final targets with the process owner before the pilot.

## Step 4 — AI validation

1. Select **Check with AI**.
2. Intended result: a strong score, preferably **above 8/10**, with validation passing only if the score is **strictly above 7/10**.
3. If the score is 7 or below, review the AI's specific gaps and update the relevant fields before checking again. Do not treat this sample's target score as guaranteed.

## Step 5 — Impact numbers

The form accepts scores from **0 to 3**. These are sample estimates for exercising the form; replace them with locally approved estimates when using real data. The app displays the active minimum priority score and calculates the weighted result.

| Field | Score | Explanation |
|---|---:|---|
| Turnaround time | 2.7 | Pilot hypothesis: a consolidated read-only queue could reduce lookup and handoff time. Establish the current median first, then compare the pilot median over the same exception types. |
| Volume | 2.5 | A defined set of recurring exception types may affect a meaningful share of the team's workload. Confirm the eligible monthly case count from approved operational reporting before the pilot. |
| Expected savings or revenue | 2.4 | Potential value is staff capacity returned to investigation and resolution work, not assumed revenue. Estimate it from measured time saved and the bank's approved cost method after the pilot. |

- **Turnaround explanation:** Measure median time from exception assignment to resolution for the agreed pilot types. Compare with a pre-pilot baseline and report sample size and period.
- **Volume explanation:** Count eligible exceptions per month using an approved report. Exclude unrelated payment cases and avoid copying customer or payment details into the idea.
- **Value explanation:** Estimate staff hours released using measured time saved multiplied by eligible cases. Do not claim a financial saving until Finance or the process owner validates the calculation.

## Before submitting

- Confirm the live priority result meets the minimum shown by the form. If the minimum has been raised above this sample's result, adjust the estimates using evidence or approved assumptions.
- Run AI validation against the latest draft version. Editing the draft after validation requires another validation run.
- Complete all five reviewer answers and all three impact scores and explanations before submitting.
- Use internal, non-sensitive examples. Do not enter account numbers, customer names, card data, live payment references, credentials, or other restricted information.
