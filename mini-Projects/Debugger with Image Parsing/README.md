# Lab 8: Visual Debugger (`img-debug`)

`img-debug` is a command-line tool that analyzes screenshots of code errors, compresses them for fast API sending, and uses an AI model with web search to find solutions. I only created a nodejs version for this so you have to use npx for this.

---

## 📦 Installation

### 1. Install Dependencies

If you are using **TypeScript / Node.js**:
```bash
npm install openai @tavily/core sharp dotenv
npm install -D typescript @types/node tsx
```

### Key Packages:
- **`sharp`** (JS): Resizes and compresses screenshots.
- **`openai`**: Connects to OpenRouter / LLM models.
- **`@tavily/core`** Runs web searches for up-to-date documentation.

---

## 🔑 Environment Setup

Create a `.env` file in your root folder:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
TAVILY_API_KEY=your_tavily_api_key
```

---

## 🚀 How to Run

Pass a screenshot file to the script:

**TypeScript:**
```bash
npx tsx img-debug.ts ./screenshot.png
```

Additionally, you can add additional prompts by adding a new argument wrapped in quotation marks
