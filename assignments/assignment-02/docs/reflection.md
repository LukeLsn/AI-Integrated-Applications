# Architecture & Implementation Reflection

## 1. System Architecture: Hybrid Workflow and Agent Model

The system was designed using a **hybrid architecture**, combining deterministic workflows for data pipeline execution with autonomous LLM agents for non-deterministic analytical tasks.

```
                    +---------------------------------------+
                    |        Data Ingestion Pipeline        |
                    |     (Deterministic Python Workflow)   |
                    +-------------------+-------------------+
                                        |
                                        v
                      +-----------------+------------------+
                      |      LLM Extraction & Parsing      |
                      |     (Structured Output Agent)      |
                      +-----------------+------------------+
                                        |
                +-----------------------+-------------------------+
                |                                                 |
                v                                                 v
    +-----------+-------------------+               +-------------+-----------------+
    |      Legitimacy Agent         |               |     Market & Gap Analysis     |
    |(Heuristic/Semantic Evaluation)|               |        Analytical Agent       |
    +-------------------------------+               +-------------------------------+

```

### Factors Influencing the Decision

* **Predictability & Reliability**: Operations such as file reading, PDF text extraction, schema validation, and JSON file generation require strict determinism. Structuring these as fixed workflows prevents unpredictable control flow and minimizes API calls.
* **Semantic Flexibility**: Parsing unstructured job descriptions, detecting fraud indicators, and conducting skills gap analysis require high-level contextual reasoning. Autonomous agents excel at these tasks when given specific roles and structured schemas.
* **Cost and Efficiency**: Routing standard text processing and data transformation through deterministic Python code reduced unnecessary token consumption.

---

## 2. Prompt Engineering for Extraction Consistency

To achieve consistent data extraction across varied job postings, the following prompt engineering techniques were applied:

1. **Strict JSON Schema Enforcement**: Pydantic schemas were integrated into the prompt instructions, explicitly defining required fields, data types, and default empty values.
2. **Explicit Null & Fallback Directives**: Models were instructed to populate missing or ambiguous attributes with `null` or `[]` rather than hallucinating plausible values.
3. **Delimiter Tagging**: Input job descriptions were wrapped in `<job_posting>` XML tags to isolate raw context from system prompt instructions and prevent prompt injection or contextual leakage.
4. **Few-Shot Boundary Examples**: Including positive and negative extraction examples helped anchor the model on edge cases, such as distinguishing required technical skills from optional "nice-to-have" qualifications.

---

## 3. Legitimacy Agent Design

### Agent Architecture & Prioritized Signals

The Legitimacy Agent evaluates job posting authenticity by scoring multiple semantic and heuristic risk factors:

* **Company & Domain Credibility**: Cross-referencing listed company names against standardized corporate entities and verifying application contact domains (e.g., flagging personal `@gmail.com` addresses for enterprise roles).
* **Compensation vs. Requirements Alignment**: Identifying suspicious discrepancies between requested experience and listed compensation (e.g., entry-level positions promising excessive hourly rates).
* **Vague & Overly Generic Descriptions**: Detecting high frequencies of buzzword-dense, non-specific job descriptions lacking concrete deliverables or team structures.
* **Payment or Financial Red Flags**: Flagging requests for upfront equipment fees, application costs, or unconventional onboarding procedures.

### System Limitations

* **No Live Web Verification**: Without live search or external API access during evaluation, the agent relies entirely on internal model context and prompt heuristics to assess corporate identity.
* **Edge Cases with Early-Stage Startups**: Legitimate early-stage startups using temporary domains, flexible job descriptions, or third-party recruiting emails can be misclassified as suspicious.
* **Sophisticated Fraud Patterns**: Well-crafted fraudulent postings that mimic standard corporate templates without obvious keyword red flags may evade detection.

---

## 4. Model Selection & Cost Optimization Strategy

Model selection was driven by a balance between cost efficiency, token budget constraints, and task complexity:

| Task Tier | Model Selected | Reasoning & Cost Strategy |
| --- | --- | --- |
| **Routine / Low-Complexity Tasks** | **Nemotron Ultra 3 Free** | Primary free model used for standard lab assignments throughout the semester. Handled routine text formatting, basic data mapping, and lightweight pre-parsing at zero API cost. |
| **Complex / Analytical Tasks** | **DeepSeek V4 Flash 0423** | Deployed for paid tier tasks requiring advanced reasoning, including skill gap synthesis, market analysis, and multi-factor legitimacy scoring. Offers high performance and low latency at a very low cost per token. |

### Cost Influence

Using a multi-tiered routing strategy kept API expenses minimal. Non-complex preprocessing and routine JSON structure validations were assigned to **Nemotron Ultra 3 Free**, reserving **DeepSeek V4 Flash 0423** exclusively for heavy analytical workloads.

---

## 5. Phase 3 Coding Agent Process
**Agent Used: Google Gemini**

* Initial Instructions: Instructed the agent to build the Phase 3 execution workflow (advise.py), incorporating raw PDF job posting extraction via OpenRouter (deepseek/deepseek-v4-flash), a legitimacy assessment agent utilizing WHOIS lookups and web search tools, diagnostic logging routed to stderr (log_debug), structured schema validation via Pydantic, and HTML application report generation.

* Iteration Count: Required 4 iterations to align tool execution inputs, fix output file encoding across platforms, and handle structured parsing failures.

**Manual Fixes Required**
* Domain Sanitization for Tool Calls: Implemented a sanitize_domain() utility function. The agent initially passed raw company strings containing whitespace and punctuation (e.g., "2iSolutions Inc.") directly to whois_lookup(), which caused domain query exceptions.

* Platform UTF-8 File Handling: Added explicit encoding="utf-8" parameters to open(out_path, "w") and file reads. On Windows environments, default system encodings (cp1252/charmap) caused crashes when saving HTML reports containing Unicode characters.

* Markdown Formatting Stripper: Added post-processing in generate_html_report() to strip markdown code block wrappers (html ... ) returned by the LLM, ensuring the output file renders directly as clean HTML.

**Evaluation of Generated Code**
* What it Got Right: Clean integration of structured Pydantic schema parsing (beta.chat.completions.parse), effective orchestration of existing Phase 1 & Phase 2 artifact files (resume.json, gap-analysis.json), and comprehensive HTML report generation prompt design.

* What it Got Wrong: I don't think Phase 3 got anything wrong

---

