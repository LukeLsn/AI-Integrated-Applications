import os
import json
from pathlib import Path
from pypdf import PdfReader
from openai import OpenAI
from schemas import ResumeSchema, GapAnalysisSchema
from tools import log_debug, web_search

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY")
)

# Use reliable models for structured outputs vs prose generation
PARSE_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free"  # Strongly supports structured output parsing
REPORT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free"

def run_phase_2(resume_pdf="data/resume/resume.pdf"):
    log_debug("Starting Phase 2: Resume Gap Analysis")
    
    # 1. Parse Resume
    pdf_path = Path(resume_pdf)
    if not pdf_path.exists():
        print(f"Error: Resume file not found at {resume_pdf}")
        return

    reader = PdfReader(str(pdf_path))
    text = "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])
    
    log_debug("Parsing resume into structured format...")
    parse_res = client.beta.chat.completions.parse(
        model=PARSE_MODEL,
        messages=[{"role": "user", "content": f"Parse this resume into structured JSON:\n\n{text}"}],
        response_format=ResumeSchema
    )
    
    if not parse_res.choices or not parse_res.choices[0].message.parsed:
        raise ValueError("Failed to parse resume using LLM structured outputs.")
        
    parsed_resume = parse_res.choices[0].message.parsed.model_dump()

    resume_out = Path("data/resume/resume.json")
    resume_out.parent.mkdir(parents=True, exist_ok=True)
    with open(resume_out, "w", encoding="utf-8") as f:
        json.dump(parsed_resume, f, indent=2)

    # 2. Read Market Analysis Data
    market_json_path = Path("data/analysis/market-analysis.json")
    if not market_json_path.exists():
        raise FileNotFoundError("data/analysis/market-analysis.json not found. Run Phase 1 first.")

    with open(market_json_path, "r", encoding="utf-8") as f:
        market_data = json.load(f)

    # 3. Perform Gap Analysis
    log_debug("Performing gap analysis against market data...")
    prompt = f"Compare this parsed resume:\n{json.dumps(parsed_resume)}\n\nAgainst market analysis data:\n{json.dumps(market_data)}"
    
    gap_res = client.beta.chat.completions.parse(
        model=PARSE_MODEL,
        messages=[{"role": "user", "content": prompt}],
        response_format=GapAnalysisSchema
    )

    if not gap_res.choices or not gap_res.choices[0].message.parsed:
        raise ValueError("Failed to perform gap analysis.")

    gap_result = gap_res.choices[0].message.parsed.model_dump()

    # Optional: Enhance recommendations with Tavily search for specific gap advice
    for item in gap_result.get("gaps", []):
        gap_title = item.get("gap")
        if gap_title:
            log_debug(f"Searching web advice for gap: {gap_title}")
            search_advice = web_search(f"how to learn and demonstrate {gap_title} for developer resume")
            item["actionable_advice"] += f"\nResearch Context: {search_advice[:200]}"

    # Save Gap Analysis JSON
    with open("data/analysis/gap-analysis.json", "w", encoding="utf-8") as f:
        json.dump(gap_result, f, indent=2)

    # 4. Generate Markdown Report
    log_debug("Generating Markdown gap analysis report...")
    
    system_instruction = (
        "You are a career consultant and tech recruiter. "
        "Create an actionable, beautifully formatted Markdown report based on the triaged gap analysis data. "
        "Do NOT return JSON or enclose the entire output in a single code block."
    )

    report_prompt = f"""
Generate a structured Gap Analysis Report in Markdown based on this triaged dataset, REFER FULLY TO THE DATASET AND DON'T TRY MAKING UP EXTRA INFORMATION WITHOUT BASIS:

# Resume Gap Analysis Report

## 1. Candidate Strengths
- Highlight key matching skills and experience align with market demand

## 2. Identified Gaps & Triage Matrix
Categorize gaps clearly by difficulty level (Quick Win, Short-term, Medium-term, Long-term) along with actionable advice:
- **Quick Win**: Immediate resume reframing / wording tweaks
- **Short-term**: Tutorials, small projects, or quick certifications (1-2 weeks)
- **Medium-term**: New frameworks, deeper portfolio projects (1-2 months)
- **Long-term**: Structural skill development / degree requirements

## 3. Unique Value Proposition
- Distinct qualifications that set the candidate apart from standard applicants

Dataset:
{json.dumps(gap_result, indent=2)}
"""

    res = client.chat.completions.create(
        model=REPORT_MODEL,
        messages=[
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": report_prompt}
        ],
        temperature=0.3
    )

    # Safe extraction check to avoid 'NoneType' errors
    if not res.choices or len(res.choices) == 0 or not res.choices[0].message.content:
        raise ValueError("LLM returned an empty response for the Markdown report.")

    content = res.choices[0].message.content.strip()

    # Strip triple backtick wrappers if model enclosed entire response in code blocks
    if content.startswith("```"):
        lines = content.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        content = "\n".join(lines).strip()

    reports_dir = Path("reports")
    reports_dir.mkdir(parents=True, exist_ok=True)
    with open(reports_dir / "gap-analysis.md", "w", encoding="utf-8") as f:
        f.write(content)

    print("Gap analysis report successfully generated at reports/gap-analysis.md")

if __name__ == "__main__":
    run_phase_2()