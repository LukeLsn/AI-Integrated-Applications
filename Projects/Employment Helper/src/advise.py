import sys
import os
import re
import json
from pathlib import Path
from pypdf import PdfReader
from openai import OpenAI
from schemas import JobPostingSchema, LegitimacyAssessmentSchema
from tools import log_debug, web_search, whois_lookup

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY")
)

MODEL_NAME = "deepseek/deepseek-v4-flash"  # Reliable model for structured outputs and long context

def sanitize_domain(company_name: str) -> str:
    """Clean company names into valid domain strings (e.g. '2iSolutions Inc.' -> '2isolutionsinc.com')."""
    cleaned = re.sub(r'[^a-zA-Z0-9]', '', company_name).lower()
    return f"{cleaned}.com" if cleaned else "example.com"

def run_legitimacy_agent(job_data: dict) -> dict:
    company = job_data.get("company_name", "Unknown Company")
    log_debug(f"Assessing legitimacy for: {company}")
    
    search_info = web_search(f"{company} official website corporate headquarters glassdoor")
    domain = sanitize_domain(company)
    
    log_debug(f"Executing WHOIS query for sanitized domain: {domain}")
    whois_info = whois_lookup(domain)

    prompt = f"""Evaluate the legitimacy of this posting and company based on this evidence:
    Job Posting: {json.dumps(job_data)}
    Web Research: {search_info}
    WHOIS Record: {json.dumps(whois_info)}
    
    Analyze flags (red vs green) and return a structured assessment."""

    res = client.beta.chat.completions.parse(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": prompt}],
        response_format=LegitimacyAssessmentSchema
    )
    
    if not res.choices or not res.choices[0].message.parsed:
        raise ValueError("Failed to parse legitimacy assessment structure from LLM response.")

    return res.choices[0].message.parsed.model_dump()

def generate_html_report(target_job: dict, resume: dict, gaps: dict, legitimacy: dict) -> str:
    prompt = f"""Generate a single-file standalone HTML report with embedded CSS styling (<style> tag in head).
    The design should be modern, responsive, professional, and visually polished.
    
    Must include 5 exact sections:
    1. Legitimacy Assessment (Lead with a prominent warning banner if the verdict is RED/YELLOW)
    2. Fit Assessment (Include a numerical fit score encouraging the candidate to apply, breakdown of matched vs missing skills)
    3. Resume Adaptation (Concrete, specific suggestions on reframing experience and skills)
    4. Cover Letter Guidance (Key points, angles, and gaps to address)
    5. Interview Prep (Likely questions, topics to review, and company talking points)

    Data Context:
    - Target Job: {json.dumps(target_job)}
    - Resume Data: {json.dumps(resume)}
    - Gap Analysis: {json.dumps(gaps)}
    - Legitimacy Results: {json.dumps(legitimacy)}
    
    Do NOT include markdown formatting wrappers (like ```html). Return raw HTML starting with <!DOCTYPE html>."""

    res = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": prompt}]
    )
    
    content = res.choices[0].message.content or ""
    
    # Strip markdown code wrappers if present
    content = content.strip()
    if content.startswith("```"):
        lines = content.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        content = "\n".join(lines).strip()
        
    return content

def run_phase_3(posting_pdf: str):
    log_debug(f"Processing new application posting: {posting_pdf}")
    
    pdf_path = Path(posting_pdf)
    if not pdf_path.exists():
        print(f"Error: Target PDF not found at {posting_pdf}")
        return

    # Read target PDF
    reader = PdfReader(str(pdf_path))
    text = "\n".join([p.extract_text() for p in reader.pages if p.extract_text()])
    
    # 1. Structured Job Extraction
    log_debug("Extracting target job structure...")
    extract_res = client.beta.chat.completions.parse(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": f"Extract structured job data:\n\n{text}"}],
        response_format=JobPostingSchema
    )
    
    if not extract_res.choices or not extract_res.choices[0].message.parsed:
        raise ValueError("Failed to extract structured data from job posting PDF.")
        
    target_job = extract_res.choices[0].message.parsed.model_dump()

    # 2. Load context from Phase 1 and Phase 2
    resume_path = Path("data/resume/resume.json")
    gap_path = Path("data/analysis/gap-analysis.json")
    
    if not resume_path.exists() or not gap_path.exists():
        raise FileNotFoundError("Missing data/resume/resume.json or data/analysis/gap-analysis.json. Please run Phase 1 and Phase 2 first.")

    with open(resume_path, "r", encoding="utf-8") as f:
        resume = json.load(f)
    with open(gap_path, "r", encoding="utf-8") as f:
        gaps = json.load(f)

    # 3. Legitimacy Assessment
    legitimacy = run_legitimacy_agent(target_job)

    # 4. Generate Application HTML Report
    log_debug("Generating HTML application report...")
    html_report = generate_html_report(target_job, resume, gaps, legitimacy)
    
    out_path = Path("reports/application-report.html")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Explicit utf-8 encoding prevents Windows charmap/cp1252 encoding errors
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html_report)
        
    print(f"Report successfully saved to {out_path}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python advise.py <path_to_pdf>")
    else:
        run_phase_3(sys.argv[1])