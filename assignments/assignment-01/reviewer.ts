import { OpenAI } from 'openai';
import { tools } from './tools.ts';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

export async function callReviewer(
  persona: string, 
  content: string, 
  debug: boolean, 
  modelName: string
) {
  const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  if (debug) console.log(`[DEBUG] [${persona}] Starting review with model: ${modelName}`);

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: getSystemPrompt(persona) },
    { role: 'user', content: `Review this code:\n\n${content}` }
  ];

  let response = await client.chat.completions.create({
    model: modelName,
    messages,
    tools: tools as any,
    temperature: 0.2,
  });

  while (response.choices[0].message.tool_calls) {
    const toolCall = response.choices[0].message.tool_calls[0];
    
    if (toolCall.type === 'function') {
      if (debug) console.log(`[DEBUG] [${persona}] Calling tool: ${toolCall.function.name} with args: ${toolCall.function.arguments}`);
      
      const toolResult = await executeTool(toolCall, debug, persona);
      
      messages.push(response.choices[0].message);
      messages.push({ 
        role: 'tool', 
        tool_call_id: toolCall.id, 
        content: JSON.stringify(toolResult) 
      });

      response = await client.chat.completions.create({
        model: modelName,
        messages,
        tools: tools as any
      });
    } else break;
  }

  if (debug) console.log(`[DEBUG] [${persona}] Review complete.`);

  const rawContent = response.choices[0].message.content || '[]';
  const cleanJson = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
  
  try {
    return JSON.parse(cleanJson);
  } catch (e) {
    if (debug) console.error(`[DEBUG] [${persona}] Failed to parse JSON response.`);
    return [];
  }
}

function getSystemPrompt(persona: string): string {
  return `You are an expert ${persona}. You have access to: 'read_file' (to read files) and 'ripgrep' (to search). Return a JSON array: [{"path": "string", "line": number, "severity": "info" | "warn" | "critical", "category": "security" | "style" | "performance" | "design" | "ui", "description": "string"}]. Rules: Only output JSON. ${persona === 'Security' ? 'FOCUS: Secrets, SQLi, XSS, dangerous logic.' : 'FOCUS: DRY, naming, readability.'}`;
}

async function executeTool(toolCall: any, debug: boolean, persona: string) {
  if (toolCall.type !== 'function') return "Error";
  const { name, arguments: args } = toolCall.function;
  const parsedArgs = JSON.parse(args);

  if (name === 'read_file') {
    try { 
        if (debug) console.log(`[DEBUG] [${persona}] Reading file: ${parsedArgs.file_path}`);
        return readFileSync(parsedArgs.file_path, 'utf-8').slice(0, 2000); 
    } catch { 
        if (debug) console.error(`[DEBUG] [${persona}] Error reading file: ${parsedArgs.file_path}`);
        return "Error: Could not read file."; 
    }
  }

  if (name === 'ripgrep') {
    try {
      if (debug) console.log(`[DEBUG] [${persona}] Running ripgrep for pattern: ${parsedArgs.search_pattern}`);
      execSync('rg --version', { stdio: 'ignore' });
      return execSync(`rg "${parsedArgs.search_pattern}"`).toString();
    } catch {
      try {
        if (debug) console.log(`[DEBUG] [${persona}] ripgrep failed, falling back to findstr`);
        const output = execSync(`findstr /S /N /C:"${parsedArgs.search_pattern}" *`).toString();
        return output || "No matches found.";
      } catch {
        return "No matches found (ripgrep not installed and findstr failed).";
      }
    }
  }
}