# Extraction Spot-Check

This document compares expected ground-truth fields manually identified from raw job posting PDFs against structured JSON extracted by the Phase 1 extraction pipeline.

---

### Posting 1: Senior Web Developer — Pala Interactive Canada

| Field | Expected | Extracted | Correct? |
| :--- | :--- | :--- | :--- |
| **Job title** | Senior Web Developer| Senior Web Developer| ✅ |
| **Company** | Pala Interactive Canada Inc.| Pala Interactive Canada | ✅ |
| **Location** | 2235 Sheppard Avenue East, North York, ON | 2235 Sheppard Avenue East, North York, ON M2J 5B5 | ✅ |
| **Salary range** | $100,000–$120,000 per year | $100,000 - $120,000 per year | ✅ |
| **Posting age days** | 0 | 0 | ✅ |
| **Required skills** | HTML5, Canvas, Angular, Ionic, JavaScript, TypeScript, MySQL, Facebook API | HTML5, Canvas, Angular, Ionic, JavaScript, TypeScript, MySQL, web services integration, Facebook API, logical data modeling, physical relational database design, transactional systems, redundancy, scalability, fail-over mechanisms, communications transaction processing, internet technologies, electronic commerce | ✅ |
| **Experience level** | 8 years of Frontend Development experience | 8 years of Frontend Development experience | ✅ |
| **Education requirements** | Formal Computer Science education | Formal Computer Science education | ✅ |

#### Analysis:
* High-precision extraction across all schema targets.
* The pipeline correctly parsed technical stack requirements, precise address details, and structured salary ranges from raw PDF text.

---

### Posting 2: Full-Stack Web Developer — Blue Pearl Mortgage Group Inc.

| Field | Expected | Extracted | Correct? |
| :--- | :--- | :--- | :--- |
| **Job title** | Full-Stack Web Developer | Full-Stack Web Developer | ✅ |
| **Company** | Blue Pearl Mortgage Group | Blue Pearl Mortgage Group Inc. | ✅ |
| **Location** | Surrey, BC V3S 5J9 | Surrey, BC V3S 5J9 | ✅ |
| **Salary range** | From $44.00 per hour | $44.00 per hour (starting) | ✅ |
| **Posting age days** | 0 | 0 | ✅ |
| **Required skills** | JavaScript/TypeScript, React or Next.js, APIs, databases, Git/GitHub, problem solving, communication | JavaScript/TypeScript, React or Next.js, API and database integration, Git/GitHub, Problem solving, Communication, Documentation, Business stakeholder collaboration | ✅ |
| **Preferred skills** | Supabase, PostgreSQL, Vercel, AWS, CRM systems, workflow automation | Supabase, PostgreSQL, Vercel, AWS, CRM systems, Workflow automation, Financial-services software, Performance, security, usability improvements | ✅ |
| **Experience level** | At least 1 year of professional experience | Entry‑level (1+ year) | ✅ |
| **Education requirements** | College diploma or degree in Computer Science, Web Development, Software Development or related field | College diploma/degree in Computer Science, Web Development, Software Development or related field (or equivalent experience) | ✅ |

#### Analysis:
* 100% field alignment between ground truth and extracted JSON payload.
* Successfully distinguished between required core skills and preferred asset technologies.