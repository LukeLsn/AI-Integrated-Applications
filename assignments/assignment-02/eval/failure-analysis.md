
# 4. Failure Analysis & Overall Observations

This document details critical operational weaknesses identified in the automated recruitment evaluation pipeline, analyzes root causes for extraction and parsing failures, and outlines structural remediations.

---

## Failure 1: Unpopulated Skills & Qualifications in JSON Extraction

### Description
In several job evaluation runs—such as the **ShearComfort Ltd. Web Developer** posting and previous test cases (Postings 1 and 2)—the parsing pipeline returned empty arrays for primary technical fields:

```json
{
  "job_title": "Web Developer",
  "company_name": "ShearComfort Ltd.",
  "location": "Vancouver, BC",
  "posting_age_days": 0,
  "required_skills": [],
  "preferred_skills": [],
  "experience_level": "",
  "education_requirements": "",
  "salary_range": ""
}
```

Even though the source posting explicitly contained actionable skills (e.g., HTML, SCSS, JavaScript, React, BigCommerce, PostgreSQL, Adobe Photoshop), the extraction module populated `company_research` with raw web scrapings while failing to write any extracted technical criteria into `required_skills` or `preferred_skills`.

### Root Cause Analysis

1. **Unbounded Context Payload Trapping:** The raw text injected into the extraction model contained massive, unstructured web search/company research payloads (e.g., address strings, unrelated regional business directories, and RSS feed headers). This caused the model's token attention mechanism to prioritize processing the lengthy `company_research` block at the expense of executing structured key-value extraction on the core job description text.
2. **Strict Schema Constraints Without Fallback Normalization:** The schema parser expected rigid keyword section headers (e.g., `Required Skills:`). When job postings categorized requirements under non-standard headers like `What We Are Looking For` or `Knowledge, skills, and abilities`, the heuristic parser bypassed the text blocks instead of applying semantic extraction.

### Proposed Remediation

* **Decouple Scraping & Extraction Pipelines:** Execute the schema extraction step strictly on the raw job description text *before* appending enrichment or company research payloads.
* **Semantic Schema Mapping:** Update the JSON extraction prompt to use open-ended zero-shot instruction parsing (e.g., "Extract all technical tools, languages, and frameworks mentioned anywhere in the document into `required_skills` regardless of section headers").
* **JSON Validation Guardrails:** Implement a post-extraction validation script that raises a soft error and triggers a re-parse fallback if `required_skills` is empty on a valid input document.

---

## Failure 2: Over-Reliance on Surface-Level Keyword Match for Fit Scoring

### Description

In evaluating pivot and crossover technical roles, the scoring engine produces artificial score inflation or suppression based on simple keyword overlaps. For example, hardware support engineering candidates with foundational C++/Java skills received depressed scores (e.g., 42/100) on roles requiring web stack fundamentals because adjacent skills (e.g., SQL, git, standard logic, system troubleshooting) were ignored during the match phase.

### Root Cause Analysis

* **Exact-String Match Bias:** The downstream matching algorithm relied heavily on exact token overlaps between the candidate profile and extracted job skills. It failed to account for transferable technical competencies, conceptual skill equivalencies, or baseline programming paradigms.

### Proposed Remediation

* **Taxonomy & Skill Graph Embeddings:** Replace exact string matching with dynamic taxonomy vector embeddings (e.g., mapping `PostgreSQL` to `General SQL / Relational Databases`, or `C++` to `Core Object-Oriented Logic`).
* **Weighted Scoring Categories:** Divide fit scoring into strict technical prerequisites (40%), transferable core skills (40%), and domain experience (20%) to prevent minor keyword omissions from completely collapsing the overall fit rating.

---

## Overall System Assessment

### What the System Does Well

* **Legitimacy & Scam Signal Detection:** The agent excels at catching multi-layered risk indicators—such as broken corporate domains,WHOIS registration discrepancies, duplicate copy-pasted job blocks, unverified addresses, and irregular contact channels (e.g., Telegram / Gmail recruiters).
* **Strategic Career Guidance:** When evaluated on complex candidate profiles, the downstream advisor provides realistic, highly tailored application advice—offering actionable portfolio roadmaps rather than generic binary rejections.

### Where the System Falls Short

* **Robustness of Initial JSON Parsing:** The pipeline is fragile when handling unformatted HTML raw dumps, occasionally dropping critical qualification fields while leaving downstream scoring engines to operate on incomplete data.
* **Context Budget Allocation:** Excessive context spending on raw research payloads negatively impacts structural extraction accuracy.
