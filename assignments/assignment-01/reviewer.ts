import { OpenAI } from 'openai';
import { tools } from './tools';
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

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

  if (debug) console.error(`[DEBUG] [${persona}] STARTING REVIEW | Model: ${modelName}`);

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: getSystemPrompt(persona) },
    { role: 'user', content: `Review this code:\n\n${content}` }
  ];

  let response = await client.chat.completions.create({
    model: modelName,
    messages,
    tools: tools as any,
    temperature: 0.1,
  });

  let iterations = 0;
  const MAX_ITERATIONS = 8; 

  while (response.choices[0].message.tool_calls && iterations < MAX_ITERATIONS) {
    iterations++;
    const toolCall = response.choices[0].message.tool_calls[0];
    
    if (toolCall.type === 'function') {
      const toolName = toolCall.function.name;
      const toolArgs = toolCall.function.arguments;
      
      if (debug) console.error(`[DEBUG] [${persona}] CALLING TOOL: ${toolName}("${toolArgs.replace(/\n/g, '')}")`);
      
      const toolResult = await executeTool(toolCall, debug, persona);
      
      if (debug) console.error(`[DEBUG] [${persona}] TOOL OUTPUT (${toolName}): ${String(toolResult).slice(0, 200).replace(/\n/g, ' ')}...`);
      
      messages.push(response.choices[0].message);
      messages.push({ 
        role: 'tool', 
        tool_call_id: toolCall.id, 
        content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult) 
      });

      response = await client.chat.completions.create({
        model: modelName,
        messages,
        tools: tools as any
      });
    } else break;
  }

  const rawContent = response.choices[0].message.content || '[]';
  const match = rawContent.match(/\[[\s\S]*\]/);
  const cleanJson = match ? match[0] : '[]';
  
  try {
    const parsed = JSON.parse(cleanJson);
    if (debug) console.error(`[DEBUG] [${persona}] FINISHED REVIEW | RAW FINDINGS:\n${JSON.stringify(parsed, null, 2)}`);
    return parsed;
  } catch (e) {
    if (debug) console.error(`[DEBUG] [${persona}] JSON Parse Failed. Raw content: ${rawContent}`);
    return [];
  }
}

function getSystemPrompt(persona: string): string {
  return `You are an expert ${persona}. 
  - GOAL: Perform a comprehensive review of the provided input (diff or file).
  - RULE: If diff is insufficient, use 'read_file' to get full context.
  - RULE: Use 'ripgrep' to verify dependencies or definitions.
  - OUTPUT: JSON array of findings: [{"path": "string", "line": number, "severity": "info"|"warn"|"critical", "category": "security"|"style"|"performance"|"design"|"ui", "description": "string"}].
  - Regardless of your primary focus, you MUST report any CRITICAL security or stability issues you encounter.
  `;
}

async function executeTool(toolCall: any, debug: boolean, persona: string) {
  const { name, arguments: args } = toolCall.function;
  const parsedArgs = JSON.parse(args);

  if (name === 'read_file') {
    const requestedPath = parsedArgs.file_path;
    const cwd = process.cwd();

    // Strategy: Resolve the path. If it starts with the current directory,
    // we use it. If not, we join it. This handles both absolute paths
    // and paths that the AI might have accidentally duplicated.
    let targetPath = path.resolve(cwd, requestedPath);

    // If the path doesn't exist, try to see if it's a sub-path relative to CWD
    if (!existsSync(targetPath)) {
      const altPath = path.join(cwd, path.basename(requestedPath));
      if (existsSync(altPath)) {
        targetPath = altPath;
      }
    }

    if (debug) console.error(`[DEBUG] [${persona}] Attempting to read: ${targetPath}`);
    
    if (!existsSync(targetPath)) {
      return `Error: File does not exist at ${targetPath}`;
    }
    
    return readFileSync(targetPath, 'utf-8').slice(0, 5000); 
  }
  
  if (name === 'ripgrep') {
    const pattern = parsedArgs.search_pattern;
    try {
      // Use '.' to ensure ripgrep searches the current directory
      return execSync(`rg --max-count 10 "${pattern.replace(/"/g, '\\"')}" .`, { encoding: 'utf8' }).slice(0, 1000);
    } catch (e: any) {
      if (e.status === 1) return "No matches found.";
      try {
        return execSync(`findstr /S /N /R "${pattern}" *`, { encoding: 'utf8' }).toString().slice(0, 1000);
      } catch { return "No matches found."; }
    }
  }
  return "Unknown tool";
}