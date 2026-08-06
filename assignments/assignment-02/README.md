# Job Search AI Assistant (Assignment 02)

An end-to-end AI application built with Python that ingests job postings and resumes, extracts structured data using LLMs, conducts web and WHOIS research, and produces strategic market, gap, and application advisories.

---

## 1. Setup Instructions

### Prerequisites
- **Python 3.10+**
- **OpenRouter API Key** (for LLM inference)
- **Tavily API Key** (for web search tool capabilities)

### Installation Steps

1. **Clone the Repository & Navigate to Assignment Folder:**
   ```bash
   git clone <your-repo-url>
   cd assignments/assignment-02
    ```

2. **Create and Activate a Virtual Environment:**

    ```bash
    # On macOS/Linux:
    python3 -m venv venv
    source venv/bin/activate

    # On Windows (Command Prompt/PowerShell):
    python -m venv venv
    .\venv\Scripts\activate

    ```


3. **Install Dependencies:**
    ```bash
    pip install pydantic openai tavily-python python-whois pypdf python-dotenv

    ```


4. **Configure Environment Variables:**
Create a `.env` file in `assignments/assignment-02/` and add your Tavily and OperRouter api keys there using variables: `OPENROUTER_API_KEY` and `TAVILY_API_KEY`


    Fill in your actual API keys in `.env`:
    ```env
    OPENROUTER_API_KEY=your_openrouter_api_key_here
    TAVILY_API_KEY=your_tavily_api_key_here
    LOG_LEVEL=debug

    ```



---

## 2. File and Directory Structure

The system strictly adheres to the mandated directory structure:

```text
assignment-02/
├── README.md                          # Setup, run, and usage instructions
├── .env.example                       # Required environment variables template
├── src/                               # Python source code
│   ├── schemas.py                     # Pydantic data schemas
│   ├── tools.py                       # Debug logger, Tavily Search, and WHOIS lookup tools
│   ├── analyze_market.py              # Phase 1 script
│   ├── analyze_resume.py              # Phase 2 script
│   └── advise.py                      # Phase 3 script
├── data/
│   ├── pdf_jobs/                      # Input directory for raw job posting PDFs
│   ├── jobs/                          # Extracted job posting data (JSON)
│   ├── resume/                        # Input resume PDF and extracted resume JSON
│   └── analysis/                      # Aggregated market & gap JSON datasets
├── reports/
│   ├── market-analysis.md             # Phase 1 Markdown report
│   ├── gap-analysis.md                # Phase 2 Markdown report
│   └── application-report.html        # Phase 3 single-file HTML report
├── eval/
│   ├── extraction-spot-check.md       # Phase 1 extraction evaluation
│   ├── scoring-check.md               # Phase 3 scoring evaluation
│   ├── legitimacy-check.md            # Phase 3 legitimacy evaluation
│   └── failure-analysis.md            # Failure analysis and observations
└── docs/
    └── reflection.md                  # Project reflection

```

---

## 3. How to Run Phase 1 (Job Market Analysis)

Phase 1 processes at least 8 job posting PDFs, performs web research on hiring companies via Tavily, extracts structured fields using Pydantic validation, and generates a human-readable Markdown market report.

1. Place your target job posting PDFs in `data/pdf_jobs/`.
2. Run the Phase 1 script:


```bash
python src/analyze_market.py

```


(To view verbose diagnostic logs on `stderr`, run `LOG_LEVEL=debug python src/analyze_market.py`)



**Outputs generated:**

* `data/jobs/<job-slug>.json` (individual structured JSON per posting)


* `data/analysis/market-analysis.json` (aggregated market dataset)


* `reports/market-analysis.md` (Markdown market report)



*Note on Re-runnability:* Phase 1 automatically skips job PDFs that have already been extracted to `data/jobs/*.json` to minimize unnecessary LLM token spend.

---

## 4. How to Run Phase 2 (Resume Gap Analysis)

Phase 2 parses your resume into ATS-friendly categories, compares your background against the market data generated in Phase 1, performs web research on addressing gaps, and triages discrepancies by effort level.

1. Place your resume PDF at `data/resume/resume.pdf`.


2. Run the Phase 2 script:


```bash
python src/analyze_resume.py

```



**Outputs generated:**

* `data/resume/resume.json` (extracted structured resume data)


* `data/analysis/gap-analysis.json` (structured strengths, triaged gaps, and unique value)


* `reports/gap-analysis.md` (Markdown gap analysis report)



---

## 5. How to Run Phase 3 (Application Advisor)

Phase 3 evaluates a new, unseen job posting PDF against your resume and market context. It runs a legitimacy agent (executing WHOIS and Tavily searches), calculates an encouraging fit score, and compiles a single-file HTML report.

Run Phase 3 by passing the file path to the target PDF as a command-line argument:

```bash
python src/advise.py data/pdf_jobs/p3_1.pdf

```

**Outputs generated:**

* `reports/application-report.html` (Standalone single-file HTML report with embedded CSS styling)



Open `reports/application-report.html` in any web browser to view the report containing:

1. Legitimacy Assessment (with warning banners if flags are triggered)


2. Fit Assessment & Match Score Breakdown


3. Resume Adaptation Suggestions


4. Cover Letter Guidance


5. Interview Preparation Questions & Talking Points




---
