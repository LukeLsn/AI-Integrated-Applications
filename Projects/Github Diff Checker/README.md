# AI Code Reviewer CLI (`review`)

> *"With enough eyeballs, all bugs are shallow."* — Linus's Law

An automated, multi-agent CLI tool designed to perform comprehensive, multi-perspective code reviews. Built on top of OpenAI SDK and OpenRouter, the tool analyzes staged Git changes or individual source files using specialized AI Reviewers, executes tool-calling to inspect wider codebase context, and synthesizes findings into a single, beautifully styled single-file HTML report.

---

## Key Features

* **Multi-Agent Architecture**: Leverages two parallel specialist AI Reviewers working simultaneously to audit your code.
* **Smart Context Gathering via Function Calling**: AI agents autonomously trigger tools like `read_file` and `ripgrep` to inspect imports, definitions, and usage patterns across the entire codebase.
* **Lead Developer Synthesis**: A third "Judge" agent de-duplicates, filters out minor nitpicks or hallucinations, resolves conflicting recommendations, and formats the output.
* **Dual Input Modes**: Supports both **Git Mode** (analyzes `git diff --staged`) and **File Mode** (analyzes a targeted file via `--file`).
* **Verbose Observability**: Includes a `--debug` mode that streams tool execution, state transitions, and raw JSON payloads to `stderr`.
* **Single-File HTML Deliverable**: Generates a self-contained, beautifully formatted HTML report ready to open in any browser.

---

## Project Architecture

```
                      +-------------------+
                      |   Target Source   |
                      | (Git Diff / File) |
                      +---------+---------+
                                |
             +------------------+------------------+
             |                                     |
             v                                     v
+------------------------+             +------------------------+
|   Security Auditor     |             | Maintainability Critic |
| (Low Temp / Strict)    |             | (Low-Med Temp / DRY)   |
+-----------+------------+             +-----------+------------+
            |                                      |
            |---- Tool Call: ripgrep --------------|
            |---- Tool Call: read_file ------------|
            |                                      |
            v                                      v
    [ JSON Payload 1 ]                     [ JSON Payload 2 ]
            |                                      |
            +------------------+-------------------+
                               |
                               v
                   +-----------------------+
                   |  Lead Developer AI    |
                   |       (Judge)         |
                   +-----------+-----------+
                               |
                               v
                  +-------------------------+
                  |  Single-File HTML Report|
                  | (review-DD-MM-YYYY.html)|
                  +-------------------------+
```

### Specialized Agents

1. **The Security Auditor**: Focuses on vulnerabilities (SQLi, XSS, hardcoded secrets/API keys, logic bugs, missing permission checks). Operating at a low temperature for strict consistency.
2. **The Maintainability Critic**: Evaluates code readability, variable naming conventions, function length, DRY violations, unused imports, and refactoring opportunities.
3. **The Lead Developer (Synthesizer)**: Evaluates intermediate JSON findings from both reviewers, removes noise/hallucination, resolves conflicts, and produces the final single-file HTML report.

---

## Installation & Setup

### Prerequisites

* **Node.js**: v18+ or higher
* **ripgrep**: Installed globally or accessible via `PATH` (used by agents to search the codebase).

### Setup Instructions

1. **Clone the repository** and navigate to the project directory:
   ```bash
   cd assignments/assignment-01
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root of the project directory and add your OpenRouter API key:
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

---

## CLI Usage

### 1. Git Mode (Default)
Reviews all currently **staged** changes (`git diff --staged`).

```bash
git add src/app.ts
node review.js
```

### 2. File Mode (`--file`)
Target and review a specific file directly without needing to stage it.

```bash
node review.js --file ./bad_code.ts
```

### 3. Debug Mode (`--debug`)
Outputs verbose real-time execution logs (tool calls, state transitions, and raw JSON findings) to `stderr` while keeping `stdout` clean.

```bash
node review.js --debug --file ./bad_code.ts
```

### 4. Custom Output Path (`--output`)
Specify a custom destination path for the generated HTML report.

```bash
node review.js --file ./bad_code.ts --output ./reports/audit-results.html
```

---

## Integrated Tools (Function Calling)

The AI reviewers are provided with function schemas and real-time execution handlers for two core context-gathering tools:

* **`read_file(file_path, [start_line], [end_line])`**: Reads content from disk to inspect surrounding code context (e.g., imports, full function definitions, interface specs). Implemented with strict token safety limits for large files.
* **`ripgrep(search_pattern)`**: Executes recursive codebase searches to verify function calls, locate usage patterns, or identify duplicate implementations across the repo.

---

## Golden Dataset Test (`bad_code.ts`)

You can test the tool against the provided sample file `bad_code.ts` to verify detection of common anti-patterns and vulnerabilities:

```bash
node review.js --debug --file bad_code.ts
```

**Expected Detections:**
* **Security Auditor**: Flags hardcoded secrets/API keys (`const apiKey = 'sk-12345...'`).
* **Maintainability Critic**: Flags poorly named variables (e.g., `const x`), unused imports (`join` from `'path'`), and unhandled direct file operations (`fs.writeFileSync`).
* **Lead Developer**: Generates an actionable, deduplicated HTML report categorizing severity (`critical`, `warn`, `info`).

---

## Project Structure

```
.
├── review.js           # Main CLI Entrypoint & Multi-Agent Orchestrator
├── bad_code.ts         # Test suite file containing intentional bugs/secrets
├── .env                # Local environment variables (API Keys)
├── package.json        # Node.js dependencies and scripts
└── README.md           # Documentation
```
