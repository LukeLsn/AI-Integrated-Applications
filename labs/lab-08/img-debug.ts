import { OpenAI } from 'openai';
import { tavily } from '@tavily/core';
import sharp from 'sharp';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { loadEnvFile } from 'node:process';

dotenv.config();

try {
  loadEnvFile(path.resolve(import.meta.dirname, '../../.env'));
} catch (envErr) {
  console.warn("⚠️ Note: Native .env file could not be loaded at the specified path. Relying on shell variables.");
}

// Verify API Keys
if (!process.env.OPENROUTER_API_KEY || !process.env.TAVILY_API_KEY) {
  console.error("Error: Please set OPENROUTER_API_KEY and TAVILY_API_KEY in your .env file.");
  process.exit(1);
}

// Initialize Clients
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

// Step 1: Image Optimization Pipeline
async function processImage(imagePath: string): Promise<string> {
  const fileStats = fs.statSync(imagePath);
  console.error(`[DEBUG] Original image size: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`);

  const buffer = await sharp(imagePath)
    .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

    const processedKB = buffer.length / 1024;
  console.error(`[DEBUG] Processed image size: ${processedKB.toFixed(2)} KB`);

  // Convert buffer to Base64
  const base64Image = buffer.toString('base64');

  // Print exact Base64 string length and size in KB
  const base64Length = base64Image.length; // Number of Base64 ASCII characters
  const base64KB = base64Length / 1024; // Convert string length to KB
  
  console.error(`[DEBUG] Base64 string length: ${base64Length.toLocaleString()} characters (${base64KB.toFixed(2)} KB)`);

  return buffer.toString('base64');
}

// Step 2: Define the Web Search Tool Schema
const tools = [
  {
    type: "function" as const,
    function: {
      name: "lookup_error",
      description: "Searches the web for technical documentation, coding errors, and other details to help with debugging the error.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to use based on the screenshot",
          },
        },
        required: ["query"],
      },
    },
  },
];

// Step 3: System Prompt
const SYSTEM_PROMPT = `
You are an expert software engineer and visual debugging assistant.
Your job is to analyze screenshots of errors, terminal outputs, IDEs, or UI layouts and provide accurate solutions.

Follow this systematic approach:
1. Describe: Identify and state error codes, exact error messages, file names, line numbers, or UI glitches visible in the screenshot.
2. Verify: If the error involves a specific library, framework version, or unknown error code, use the \`lookup_error\` tool to search for documentation and solutions.
3. Analyze: Explain the root cause of the issue clearly, incorporating information found via web search if applicable.
4. Fix: Provide a clear, actionable solution including exact code snippets, terminal commands, or configuration changes.

Important Rules:
- If the image is not related to software development or terminal errors (e.g., a photo of an animal or landscape), politely inform the user that no technical error was detected.
- Always include helpful documentation links from search results when available.
`;

// Step 4: Interaction Loop
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log("Usage: npx tsx img-debug.ts <path-to-screenshot> [optional user prompt]");
    process.exit(1);
  }

  const imagePath = args[0];
  const userPromptText = args[1] || "Please analyze this error screenshot and help me fix it.";

  if (!fs.existsSync(imagePath)) {
    console.error(`Error: File non-existent at path: ${imagePath}`);
    process.exit(1);
  }

  // Optimize and encode image
  const base64Image = await processImage(imagePath);
  const dataUrl = `data:image/jpeg;base64,${base64Image}`;

  // Initial Message State
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        { type: "text", text: userPromptText },
        {
          type: "image_url",
          image_url: { url: dataUrl },
        },
      ],
    },
  ];

  console.error("[DEBUG] Sending initial request to model...");

  // Send request to vision model on OpenRouter
  let response = await openai.chat.completions.create({
    model: "google/gemini-3-flash-preview",
    messages: messages,
    tools: tools,
    tool_choice: "auto",
  });

  let responseMessage = response.choices[0].message;

  // Handle Tool Calls Loop
  while (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
    messages.push(responseMessage); // Save model's response (with tool call) to history

    for (const toolCall of responseMessage.tool_calls) {
      if (toolCall.function.name === "lookup_error") {
        const args = JSON.parse(toolCall.function.arguments);
        console.error(`\n🔍 [TOOL CALL] Searching Tavily for: "${args.query}"`);

        // Perform Tavily Search
        const searchResult = await tvly.search(args.query, {
          maxResults: 5,
        });

        // Format search output for model context
        const formattedResults = searchResult.results.map((r: any) => ({
          title: r.title,
          url: r.url,
          content: r.content,
        }));

        console.error(`[DEBUG] Found ${formattedResults.length} search results.`);

        // Append tool result message
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(formattedResults),
        });
      }
    }

    // Get follow-up response from LLM with tool output added
    console.error("[DEBUG] Requesting final response after tool execution...");
    response = await openai.chat.completions.create({
      model: "google/gemini-3-flash-preview",
      messages: messages,
      tools: tools,
    });

    responseMessage = response.choices[0].message;
  }

  // Final Answer Output
  console.log("\n=================== DEBUG ASSISTANT RESPONSE ===================\n");
  console.log(responseMessage.content);
}

main().catch((err) => {
  console.error("Fatal Error:", err);
});