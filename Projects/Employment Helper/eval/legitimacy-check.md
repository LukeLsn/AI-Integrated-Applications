# 3. Legitimacy Check (eval/legitimacy-check.md)

This evaluation tests the performance and signal detection of the Legitimacy Agent across two postings from the evaluation phase: one moderate-risk role with structural mismatches and one highly suspicious posting containing explicit red flags.

---

## Test Case 1: Moderate Risk Posting

### Posting Overview
* **Company:** 2iSolutions Inc.
* **Role:** Intermediate Front End Developer
* **Source / URL:** Third-Party Job Listing

### Signals Identified by Agent
* **Domain & Entity Verification:** Business domain registered, but WHOIS record flags and domain setup require proceed-with-caution status.
* **Core Business vs. Role Mismatch:** Significant divergence between 2iSolutions’ core business model (SAP consultancy) and a pure Jamstack/React requirement.
* **Job Description Quality:** Standard responsibilities listed, but heavy skill requirements (React, Next.js, Jamstack, Azure, Figma) lack clear context regarding existing company projects.
* **Communication & Risk Profile:** No immediate advance-fee scam markers, but structural mismatch lowers certainty.

### Agent Verdict & Confidence Score
* **Verdict:** Moderate Risk / Proceed with Caution
* **Confidence Score:** `60%`

### Assessment Agreement
* **Agreement:** **Yes.**
* **Rationale:** The agent correctly identified the operational misalignment between an SAP consultancy firm and a standalone Jamstack/React position, offering a balanced risk score while providing actionable application advice.

---

## Test Case 2: Suspicious / High-Risk Posting

### Posting Overview
* **Company:** Interactive Sports Technologies
* **Role:** Installer / Technician
* **Source / URL:** Unverified Third-Party Job Board

### Signals Identified by Agent
* **Domain & Network Infrastructure:** Non-resolvable corporate domain preventing standard email or web infrastructure verification.
* **Content Quality & Duplication:** Identical copy-pasted text blocks repeating across skills and responsibilities sections.
* **Location & Entity Verification:** Unverified physical corporate address provided in the listing.
* **Research Data Integrity:** Corrupt or non-matching Glassdoor research data returned during automated entity lookup.

### Agent Verdict & Confidence Score
* **Verdict:** High Risk / Red Flag — Do Not Engage
* **Confidence Score:** `23%`

### Assessment Agreement
* **Agreement:** **Yes.**
* **Rationale:** The agent accurately flagged multiple severe structural indicators (broken domain, copy-pasted content, bad address data) and prioritizes user safety by recommending that the candidate avoid applying regardless of technical skill fit.