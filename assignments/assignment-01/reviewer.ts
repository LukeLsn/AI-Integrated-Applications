import OpenAI from 'openai';
import { tools } from './tools';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { ChatCompletionMessageParam, ChatCompletionMessageToolCall } from 'openai/resources/chat/completions';

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function callReviewer(persona: string, content: string, debug: boolean) {
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: getSystemPrompt(persona) },
    { role: 'user', content: `Review this code:\n\n${content}` }
  ];

  let response = await client.chat.completions.create({
    model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    messages,
    tools: tools as any,
    temperature: 0.2,
  });

  while (response.choices[0].message.tool_calls) {
    const toolCall = response.choices[0].message.tool_calls[0];
    
    if (toolCall.type === 'function') {
      if (debug) console.error(`[${persona}] Calling ${toolCall.function.name}...`);
      
      const toolResult = await executeTool(toolCall);
      
      messages.push(response.choices[0].message);
      messages.push({ 
        role: 'tool', 
        tool_call_id: toolCall.id, 
        content: JSON.stringify(toolResult) 
      });

      response = await client.chat.completions.create({
        model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
        messages,
        tools: tools as any
      });
    } else break;
  }

  const rawContent = response.choices[0].message.content || '[]';
  const cleanJson = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
  
  try {
    return JSON.parse(cleanJson);
  } catch (e) {
    return [];
  }
}

function getSystemPrompt(persona: string): string {
  return `You are an expert ${persona}. Return a JSON array: [{"path": "string", "line": number, "severity": "info" | "warn" | "critical", "category": "security" | "style" | "performance" | "design" | "ui", "description": "string"}]. Rules: Only output JSON. ${persona === 'Security' ? 'FOCUS: Secrets, SQLi, XSS, dangerous logic.' : 'FOCUS: DRY, naming, readability.'}`;
}

async function executeTool(toolCall: ChatCompletionMessageToolCall) {
  if (toolCall.type !== 'function') return "Error";
  const { name, arguments: args } = toolCall.function;
  const parsedArgs = JSON.parse(args);

  if (name === 'read_file') {
    try { return readFileSync(parsedArgs.file_path, 'utf-8').slice(0, 2000); } catch { return "Error: Could not read file."; }
  }
  if (name === 'ripgrep') {
    try { return execSync(`rg "${parsedArgs.search_pattern}"`).toString(); } catch { return "No matches found."; }
  }
}