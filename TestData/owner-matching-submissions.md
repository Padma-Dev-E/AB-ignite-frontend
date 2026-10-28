# Business Owner Matching — Five Test Idea Submissions

Use these five complete, synthetic submissions to exercise AI business-owner matching. Each idea is written to fit one seeded owner profile without naming that owner in the submission. **Do not copy the “Expected match” note into the app.** Owner matching runs after a maintainer accepts a submitted idea. AI recommendations are evidence-based but not guaranteed; low confidence or a failed match can require manual assignment.

All details and impact scores below are test data, not Arab Bank operational facts or approved estimates. Use the `@example.test` accounts created by `db:seed`. All seeded accounts initially use `DEFAULT_ADMIN_PASSWORD` (default `Test@123`) and require a password change at first login.

## Expected match map

| Test | Expected seeded owner | Matching domain |
|---|---|---|
| 1 | `owner.retail@example.test` — Layla Haddad | Retail digital onboarding |
| 2 | `owner.corporate@example.test` — Omar Nasser | Corporate trade finance servicing |
| 3 | `owner.operations@example.test` — Rana Khalil | Branch operations and request routing |
| 4 | `owner.risk-compliance@example.test` — Samir Mansour | KYC review evidence and control execution |
| 5 | `owner.digital-technology@example.test` — Dima Farouk | Digital platform reliability |

## 1. Retail digital account-opening progress

**Expected match:** `owner.retail@example.test` — do not enter this in the idea form.

### Step 1 — Describe

- **Type:** An idea
- **Your idea in your own words:**

  People applying to open a retail account through a digital channel may not know whether their application is complete or what step remains. I propose a secure progress view that shows the current application stage, identifies missing items using approved status data, and explains how to continue or request help. It must not make eligibility, KYC, or account-opening decisions. Pilot with one retail account journey and compare completion, avoidable support contacts, and processing time with a baseline agreed by the product owner.
- **If related ideas appear and none is relevant, differentiation:** This proposal is limited to showing the applicant’s progress through a retail digital account-opening journey; it does not change onboarding policy or automate review decisions.

### Step 2 — Develop

- **Idea title:** Secure Progress View for Digital Retail Account Opening
- **Summary:** Show applicants the current stage of a retail digital account-opening application, any outstanding approved requirements, and a safe next step. Keep eligibility, KYC review, and account-opening decisions in existing controlled processes. Pilot one journey and measure completion, support contacts, and processing time.
- **Problem statement:** Applicants may be uncertain whether an application was received, whether information is missing, or whether a review is still in progress. This uncertainty can lead to repeated contacts and incomplete applications. The affected journey and baseline rates should be confirmed with the retail product owner.
- **Proposed solution:** Add a secure status view to one existing digital application journey. Display only approved stage labels and outstanding actions from the authoritative application workflow. Provide a safe resume or support route, apply existing authentication and privacy controls, and record status changes. Do not expose reviewer notes or allow the view to approve, reject, or alter an application.
- **Expected benefits:** Help applicants understand the next step, reduce avoidable status enquiries, and make incomplete applications easier to identify. Assess results against a pre-pilot baseline before considering wider rollout.
- **Possible risks:** Stale status, disclosure to the wrong person, or confusing a progress label with an approval could harm trust. Use authenticated access, authoritative status data, clear wording, freshness checks, and existing human review and decision controls.
- **Data classification:** Internal

### Step 3 — Questions reviewers may ask

- **Who benefits?** Retail account applicants who use the selected digital journey, and retail servicing teams handling application-status enquiries.
- **What happens today?** Applicants use the current application journey and may contact support when the next step or status is unclear. The product owner should confirm the actual handoffs and baseline enquiry volume.
- **What is needed?** A retail product owner, one pilot journey, approved status fields from the authoritative application workflow, identity and access review, clear applicant wording, and support escalation ownership.
- **What could go wrong?** A status could be stale, visible to the wrong person, or mistaken for an approval. Restrict access, show only approved status labels, test data freshness, and keep all eligibility and KYC decisions in existing controls.
- **How is success measured?** Compare application completion, incomplete-application rate, status-related support contacts, and elapsed processing time with a baseline for the same journey. Review access incidents and incorrect status displays.

### Step 5 — Impact numbers

Synthetic priority-gate inputs only; scores are not measured benefits. Change them if the live minimum requires another value.

| Field | Score (0–3) | Explanation |
|---|---:|---|
| Turnaround time | 3.0 | Test maximum score only. Measure elapsed time from application start to completion in the pilot. |
| Volume | 3.0 | Test maximum score only. Confirm eligible applications using approved aggregate reporting. |
| Expected savings or revenue | 3.0 | Test maximum score only. Estimate any capacity benefit from measured reduction in status enquiries; do not claim savings before review. |

## 2. Corporate trade-finance document readiness

**Expected match:** `owner.corporate@example.test` — do not enter this in the idea form.

### Step 1 — Describe

- **Type:** An idea
- **Your idea in your own words:**

  Corporate trade-finance requests can require documents and checks from several parties. I propose a shared readiness checklist that shows which required documents have been received, which team owns the next action, and whether an item needs review. It should improve visibility for corporate servicing teams and relationship staff while leaving document acceptance, transaction approval, and payment decisions with authorized staff. Pilot a defined request type and measure avoidable follow-up and time to readiness.
- **If related ideas appear and none is relevant, differentiation:** This proposal tracks trade-finance document readiness for corporate requests; it does not route retail applications or decide whether a transaction is approved.

### Step 2 — Develop

- **Idea title:** Trade-Finance Document Readiness Checklist
- **Summary:** Give corporate servicing teams a controlled view of required trade-finance documents, missing items, assigned follow-ups, and review status. Keep document acceptance and transaction decisions with authorized reviewers. Pilot one request type and compare follow-up and readiness time with a baseline.
- **Problem statement:** Staff coordinating a corporate trade-finance request may need to confirm document receipt and follow-up ownership across several handoffs. Missing visibility can cause repeated enquiries or delays. The process owner should identify the request types and baseline before implementation.
- **Proposed solution:** Configure a checklist for one agreed trade-finance request type. Show requirement status, accountable team, timestamp, and a link to the authorized source record. Use role-based access and audit history. Do not store unnecessary document copies, accept documents automatically, or approve a transaction.
- **Expected benefits:** Make outstanding actions easier to identify, reduce avoidable follow-up, and improve handoffs between corporate servicing and specialist teams. Validate impact in a limited pilot.
- **Possible risks:** An incomplete checklist, stale status, or excessive access to client documents could create operational or confidentiality risks. Have the process owner approve the checklist, link to controlled source records, restrict access, and preserve all existing review and approval steps.
- **Data classification:** Internal

### Step 3 — Questions reviewers may ask

- **Who benefits?** Corporate servicing staff, relationship teams, and specialist teams coordinating trade-finance request documents.
- **What happens today?** Teams coordinate document receipt and next actions through the current request process. Confirm the exact handoffs, systems, and baseline follow-up with the corporate process owner.
- **What is needed?** A named corporate process owner, one request type, an approved requirements checklist, authorized source-system links, role mapping, audit history, and review by operations, technology, risk, and legal as applicable.
- **What could go wrong?** A missing requirement could be overlooked, a document status could be stale, or a user could infer that readiness means transaction approval. Label status clearly, test the checklist, show update times, and retain authorized approval steps.
- **How is success measured?** Compare time from request initiation to document readiness, avoidable follow-up count, and rework for the pilot type with a pre-pilot baseline. Review checklist omissions and access exceptions.

### Step 5 — Impact numbers

Synthetic priority-gate inputs only; scores are not measured benefits. Change them if the live minimum requires another value.

| Field | Score (0–3) | Explanation |
|---|---:|---|
| Turnaround time | 3.0 | Test maximum score only. Measure elapsed time to document readiness for the selected request type. |
| Volume | 3.0 | Test maximum score only. Confirm eligible request counts with approved aggregate reporting. |
| Expected savings or revenue | 3.0 | Test maximum score only. Estimate capacity from measured reduction in follow-up after the pilot. |

## 3. Branch operations request routing

**Expected match:** `owner.operations@example.test` — do not enter this in the idea form.

### Step 1 — Describe

- **Type:** An idea
- **Your idea in your own words:**

  Branch staff may need to send operational requests to different support teams and may not know who owns the next action or whether a request is blocked. I propose a simple internal request-routing view that classifies approved request types, assigns an accountable queue, and shows age and handoff status. Staff would review and route each request; the tool would not make customer, payment, or control decisions. Pilot with a small group of branches and measure time to assignment, re-routing, and overdue work.
- **If related ideas appear and none is relevant, differentiation:** This proposal improves internal branch-operations request ownership and handoffs; it is not a customer account-opening tracker or a payment reconciliation tool.

### Step 2 — Develop

- **Idea title:** Branch Operations Request Ownership and Handoff View
- **Summary:** Give branch and support teams one internal view of operational requests, accountable queues, request age, and handoff status. Keep routing decisions reviewable and preserve existing controls. Pilot a small set of request types and compare assignment time, re-routing, and overdue work with a baseline.
- **Problem statement:** Internal branch requests can pass between teams, making ownership and queue age difficult to see. Unclear handoffs may delay routine operational support. The operations owner should confirm affected request types and current performance before a pilot.
- **Proposed solution:** Provide an internal work view for agreed operational request categories. Route using approved ownership rules, display the current accountable team and timestamps, and allow authorized staff to correct misroutes with an audit trail. Exclude customer-sensitive details unless required and approved. Do not trigger payments or make customer-impacting decisions.
- **Expected benefits:** Improve visibility of ownership, help teams identify aging work, reduce avoidable re-routing, and support workload planning. Verify results against a defined baseline and sample reviewed requests.
- **Possible risks:** Incorrect categories or ownership rules could delay a request; broad access could expose information; and staff could rely on stale queue data. Start with limited categories, show update time, test routing with staff, restrict access, and maintain a manual escalation path.
- **Data classification:** Internal

### Step 3 — Questions reviewers may ask

- **Who benefits?** Branch staff raising operational requests and the operations teams responsible for accepting and completing them.
- **What happens today?** Requests follow existing branch-support channels and are handled by the relevant teams. Confirm how requests are categorized, transferred, and escalated before designing the pilot.
- **What is needed?** A branch-operations process owner, a small set of request types, current ownership rules, authorized queue data, role-based access, and agreement on escalation and audit requirements.
- **What could go wrong?** A request might be sent to the wrong queue, appear complete when it is not, or remain hidden because its status is stale. Test ownership rules, retain manual correction and escalation, and show timestamps and accountable teams.
- **How is success measured?** Compare time to first assignment, re-routing rate, age of open work, and overdue requests for the pilot group with a baseline. Review misroutes and access exceptions.

### Step 5 — Impact numbers

Synthetic priority-gate inputs only; scores are not measured benefits. Change them if the live minimum requires another value.

| Field | Score (0–3) | Explanation |
|---|---:|---|
| Turnaround time | 3.0 | Test maximum score only. Measure request time to first accepted assignment. |
| Volume | 3.0 | Test maximum score only. Confirm in-scope requests using approved aggregate reporting. |
| Expected savings or revenue | 3.0 | Test maximum score only. Estimate capacity only from measured reduction in re-routing and follow-up. |

## 4. KYC review evidence completeness

**Expected match:** `owner.risk-compliance@example.test` — do not enter this in the idea form.

### Step 1 — Describe

- **Type:** An idea
- **Your idea in your own words:**

  Teams performing scheduled customer due-diligence reviews need to confirm that required evidence and review steps are present before a case is completed. I propose a configurable completeness checklist that highlights missing evidence, records who completed each required step, and sends a reminder when a review is approaching its due date. It must not decide customer risk, clear a case, or replace KYC, AML, or sanctions controls. Pilot one review category and measure rework and completeness through authorized quality review.
- **If related ideas appear and none is relevant, differentiation:** This proposal supports evidence completeness and accountability in periodic KYC reviews; it does not automate customer risk decisions or change compliance requirements.

### Step 2 — Develop

- **Idea title:** KYC Review Evidence Completeness Checklist
- **Summary:** Help authorized reviewers confirm that required evidence and review steps are recorded for a defined periodic KYC review category. Highlight missing items and due dates while keeping customer-risk judgments, case clearance, and escalation with authorized staff. Pilot one category and measure completeness and rework.
- **Problem statement:** A reviewer may need to confirm several required evidence items and review steps before a periodic KYC case is ready for quality review. Incomplete records can lead to rework. The control owner should confirm the applicable checklist and baseline from approved quality reporting.
- **Proposed solution:** Configure a checklist from requirements approved by the relevant control owner. Link to authorized source records instead of copying sensitive evidence, show completion ownership and timestamps, and flag missing items for human follow-up. Keep risk decisions, sanctions review, case disposition, and escalation in existing authorized controls.
- **Expected benefits:** Make missing evidence easier to identify, improve consistency of review records, and reduce avoidable rework. Confirm any improvement through independent quality sampling before wider use.
- **Possible risks:** An incomplete checklist could imply that a review is compliant when a substantive issue remains; sensitive information could be exposed; or reminders could cause inappropriate prioritization. Obtain control-owner approval, label the checklist as completeness support only, restrict access, and retain substantive decisions and escalation with authorized reviewers.
- **Data classification:** Internal

### Step 3 — Questions reviewers may ask

- **Who benefits?** Authorized KYC reviewers, quality-review teams, and control owners responsible for the selected periodic review category.
- **What happens today?** Reviewers complete the current due-diligence process and record evidence and decisions in approved systems. The control owner should confirm required evidence, review steps, and the source of quality baselines.
- **What is needed?** Control-owner approval of the checklist, one review category, authorized source-system links, access and retention review, clear separation between completeness and risk decisions, and quality sampling.
- **What could go wrong?** A checklist could omit a requirement or be mistaken for a compliance decision. Keep requirements controlled by the owner, label checklist status clearly, and preserve all substantive review, escalation, and approval steps.
- **How is success measured?** Compare missing-evidence findings and rework in authorized quality samples with a baseline for the same review category. Track overdue items and confirm there are no unauthorized case clearances or access incidents.

### Step 5 — Impact numbers

Synthetic priority-gate inputs only; scores are not measured benefits. Change them if the live minimum requires another value.

| Field | Score (0–3) | Explanation |
|---|---:|---|
| Turnaround time | 3.0 | Test maximum score only. Measure elapsed review time without reducing required review steps. |
| Volume | 3.0 | Test maximum score only. Confirm eligible review cases using approved aggregate reporting. |
| Expected savings or revenue | 3.0 | Test maximum score only. Estimate capacity from measured rework reduction; do not assume a financial saving. |

## 5. Digital channel dependency health view

**Expected match:** `owner.digital-technology@example.test` — do not enter this in the idea form.

### Step 1 — Describe

- **Type:** An idea
- **Your idea in your own words:**

  When a mobile or online banking feature depends on several internal services, support and technology teams may need to check multiple monitoring views to understand whether a service disruption is related to a downstream dependency. I propose an internal health view that summarizes approved technical signals, dependency status, and incident ownership for selected digital journeys. It should help technical teams investigate and coordinate response without displaying customer data or taking automated recovery actions. Pilot one journey and measure time to identify the responsible service and time to coordinate an incident.
- **If related ideas appear and none is relevant, differentiation:** This proposal is an internal technical dependency and incident-coordination view; it does not change customer onboarding, corporate servicing, or compliance review decisions.

### Step 2 — Develop

- **Idea title:** Digital Banking Dependency Health and Incident Handoff View
- **Summary:** Give authorized technology and service teams a consolidated view of approved health signals, dependencies, and incident ownership for one digital banking journey. Use aggregate technical telemetry only and keep recovery actions under existing change controls. Pilot one journey and compare investigation and coordination time with a baseline.
- **Problem statement:** A digital journey may rely on multiple internal services. During an incident, teams may need to compare separate monitoring views to understand which dependency needs investigation and who owns the next action. The technology service owner should confirm the current investigation steps and baseline.
- **Proposed solution:** Build a restricted internal view that maps one selected digital journey to approved service-health signals, dependency relationships, timestamps, and accountable support teams. Link to existing monitoring and incident records. Exclude customer-level information and do not restart services, change configuration, or deploy fixes automatically.
- **Expected benefits:** Help technical teams identify relevant dependencies sooner, improve incident handoffs, and make service-health information easier to review. Assess effects on investigation time, handoff delay, and false alerts during a controlled pilot.
- **Possible risks:** Incorrect dependency maps or stale signals could misdirect incident response; an exposed view could reveal sensitive architecture; and teams could mistake an indicator for proof of cause. Restrict access, show signal freshness and source, test the map with service owners, and keep incident decisions and recovery under existing controls.
- **Data classification:** Internal

### Step 3 — Questions reviewers may ask

- **Who benefits?** Authorized digital-platform support, application, infrastructure, and incident-management teams responsible for the selected journey.
- **What happens today?** Teams consult existing monitoring and incident records to investigate service issues. The service owner should map the current investigation and handoffs before selecting a pilot journey.
- **What is needed?** A technology service owner, an approved dependency map, selected aggregate telemetry, source and freshness indicators, restricted access, and alignment with existing incident and change-management processes.
- **What could go wrong?** A stale or misleading signal could send responders to the wrong service, or architecture details could be exposed too broadly. Validate signals with service owners, show timestamps and sources, limit access, and keep recovery actions human-controlled.
- **How is success measured?** Compare time to identify the relevant service, time to assign an incident owner, and false-alert rate with a baseline for the pilot journey. Review access and change-control exceptions.

### Step 5 — Impact numbers

Synthetic priority-gate inputs only; scores are not measured benefits. Change them if the live minimum requires another value.

| Field | Score (0–3) | Explanation |
|---|---:|---|
| Turnaround time | 3.0 | Test maximum score only. Measure time to identify the responsible service and assign an incident owner. |
| Volume | 3.0 | Test maximum score only. Confirm in-scope incidents using approved aggregate reporting. |
| Expected savings or revenue | 3.0 | Test maximum score only. Estimate capacity from measured investigation time; do not assume financial savings. |

## Submit and inspect the match

1. Sign in as `seed.employee@example.test` and create one idea using all fields in a single test section.
2. Run AI validation, answer the five reviewer questions, enter the impact scores, and submit. The displayed validation score may vary; improve the draft if needed or follow the human-review option after two failed versions.
3. Sign in as `seed.maintainer@example.test`, open the submitted idea, and accept it. Owner matching is queued after maintainer acceptance.
4. Inspect the idea’s owner-matching result in the maintainer/admin workflow. Compare the selected owner with the expected match above. If the AI requests manual assignment, use the available owner-assignment action and record that result separately.
5. Repeat for the other four ideas. Do not enter customer names, account numbers, live operational metrics, transaction details, or other restricted data.
