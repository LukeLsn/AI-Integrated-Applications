import os
import json
from pathlib import Path
from datetime import datetime
from pypdf import PdfReader
from openai import OpenAI
from schemas import JobPostingSchema
from tools import log_debug, web_search

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY")
)

def extract_pdf_text(pdf_path: str) -> str:
    reader = PdfReader(pdf_path)
    return "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])

def process_job_pdf(pdf_path: Path):
    slug = pdf_path.stem
    output_json_path = Path(f"data/jobs/{slug}.json")
    
    # Re-run check: skip if output file already exists[cite: 1]
    if output_json_path.exists():
        log_debug(f"Skipping already processed job: {pdf_path.name}")
        with open(output_json_path, "r") as f:
            return json.load(f)

    log_debug(f"Extracting posting: {pdf_path.name}")
    raw_text = extract_pdf_text(str(pdf_path))
    today_str = datetime.now().strftime("%Y-%m-%d")

    prompt = f"Today's date is {today_str}. Extract structured details from this job posting text:\n\n{raw_text}"
    
    response = client.beta.chat.completions.parse(
        model="nvidia/nemotron-3-super-120b-a12b:free",
        messages=[{"role": "user", "content": prompt}],
        response_format=JobPostingSchema
    )
    
    data = response.choices[0].message.parsed.model_dump()
    
    # Conduct company web research[cite: 1]
    company = data.get("company_name")
    if company:
        research = web_search(f"{company} company size culture news")
        data["company_research"] = research

    output_json_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_json_path, "w") as f:
        json.dump(data, f, indent=2)
        
    return data

def run_phase_1(jobs_dir="data/pdf_jobs"):
    pdf_files = list(Path(jobs_dir).glob("*.pdf"))
    if not pdf_files:
        print(f"No PDFs found in {jobs_dir}")
        return

    extracted_jobs = [process_job_pdf(p) for p in pdf_files]

    # Save aggregated raw JSON data
    analysis_dir = Path("data/analysis")
    analysis_dir.mkdir(parents=True, exist_ok=True)
    with open(analysis_dir / "market-analysis.json", "w") as f:
        json.dump(extracted_jobs, f, indent=2)

    print("[DEBUG] Generating Job Market Analysis Markdown Report...")

    # System instruction enforces markdown prose, preventing raw JSON mirroring
    system_instruction = (
        "You are an expert technical recruiter and market analyst. "
        "Your task is to synthesize raw job market data into a structured, human-readable Markdown report. "
        "Do NOT return JSON. Do NOT write code blocks. Output clean, formatted Markdown prose using headers, bullet points, and tables."
    )

    report_prompt = f"""
Analyze the following dataset of {len(extracted_jobs)} job postings and produce a comprehensive Market Analysis Report in Markdown format.

Your report must include the following sections:
# Job Market Analysis Report

## 1. Most Commonly Required Skills & Technologies
- Core hard skills, frameworks, and programming languages
- Nice-to-have or preferred tools

## 2. Typical Experience Levels & Education Requirements
- Seniority breakdown and required years of experience
- Common degree or certification expectations

## 3. Salary Ranges & Compensation Patterns
- Overview of listed salary ranges (or market observations if unlisted)

## 4. Common Responsibilities & Role Patterns
- Standard day-to-day duties across postings

## 5. Industry & Culture Signals
- Company size trends, remote work options, and cultural expectations gathered from research

## 6. Key Trends & Strategic Advice
- Notable patterns and key takeaways for applicants

Dataset to analyze:
{json.dumps(extracted_jobs, indent=2)}
"""

    res = client.chat.completions.create(
        model="deepseek/deepseek-v4-flash",
        messages=[
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": report_prompt}
        ],
        temperature=0.3
    )

    # Clean potential ```markdown ... ``` wrapper blocks from the output string
    content = res.choices[0].message.content or ""
    if content.startswith("```"):
        lines = content.splitlines()
        # Remove opening ``` markdown / ``` and closing ```
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        content = "\n".join(lines).strip()

    reports_dir = Path("reports")
    reports_dir.mkdir(parents=True, exist_ok=True)
    with open(reports_dir / "market-analysis.md", "w", encoding="utf-8") as f:
        f.write(content)

    print("Market analysis report successfully generated at reports/market-analysis.md")

if __name__ == "__main__":
    run_phase_1()