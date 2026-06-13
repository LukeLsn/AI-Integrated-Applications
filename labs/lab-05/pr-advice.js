#!/usr/bin/env node

import { parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';
import { readGitHubFiles, tools } from './tools.js';

function printHeader() {
    console.log("=".repeat(62));
    const studentName = "Luke Olsen Tristan Ramos";
    const studentID = "AIP444-Lab05"; 
    const now = new Date();
    const runDate = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;

    console.log(`pr-advice: Developed by ${studentName} - ${studentID}`);
    console.log(`Run Date: ${runDate}`);
    console.log("=".repeat(62));
}

function parseArguments() {
    let positionals;
    try {
        ({ positionals } = parseArgs({ allowPositionals: true }));
    } catch (err) {
        console.error('❌ Error parsing CLI parameters:', err.message);
        process.exit(1);
    }

    if (!positionals || positionals.length === 0) {
        console.error('❌ Error: Missing mandatory argument target URL string.');
        console.error('Usage: node pr-advice.js <github-pr-url>');
        process.exit(1);
    }

    return { targetUrl: positionals[0] };
}

function validateApiKey() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
        console.error("❌ Error: OPENROUTER_API_KEY environment parameter missing.");
        process.exit(1);
    }
    return apiKey;
}

function parseGitHubPrUrl(urlStr) {
    try {
        const url = new URL(urlStr);
        if (url.hostname !== 'github.com') {
            throw new Error('Host domain must be github.com');
        }
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length < 4 || parts[2] !== 'pull') {
            throw new Error('URL format error. Use structure: https://github.com/{owner}/{repo}/pull/{number}');
        }
        return { owner: parts[0], repo: parts[1], prNumber: parts[3] };
    } catch (err) {
        console.error('❌ Error: Invalid GitHub Pull Request URL pattern provided.', err.message);
        process.exit(1);
    }
}

/**
 * Hits the public live GitHub REST API endpoints dynamically to pull real patches
 */
async function fetchLiveDiff(owner, repo, prNumber) {
    const targetUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`;
    const response = await fetch(targetUrl, {
        headers: { 'Accept': 'application/vnd.github.v3.diff' }
    });
    if (!response.ok) {
        throw new Error(`Failed fetching raw pull request diff code stream from API channel: ${response.statusText}`);
    }
    return await response.text();
}

/**
 * Hits the public live GitHub REST API endpoints dynamically to pull live comment history
 */
async function fetchLiveComments(owner, repo, prNumber) {
    const targetUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;
    const response = await fetch(targetUrl);
    if (!response.ok) {
        throw new Error(`Failed fetching pull request thread data stream from API channel: ${response.statusText}`);
    }
    const arrayData = await response.json();
    
    // Convert to XML block tags format expected by SYSTEM_PROMPT.md
    let xmlStructure = "<thread>\n";
    for (const comment of arrayData) {
        xmlStructure += `  <comment username="${comment.user.login}" date="${comment.created_at}">\n`;
        xmlStructure += `    ${comment.body}\n`;
        xmlStructure += `  </comment>\n`;
    }
    xmlStructure += "</thread>";
    return xmlStructure;
}

async function getFileContents(filename, label) {
    try {
        return await readFile(filename, 'utf-8');
    } catch (err) {
        console.error(`❌ Error reading standard ${label} [${filename}]:`, err.message);
        process.exit(1);
    }
}

// ============================================================================
// DYNAMIC WORKFLOW EXECUTION ENGINE
// ============================================================================
async function main() {
    printHeader();
    
    const { targetUrl } = parseArguments();
    const apiKey = validateApiKey();
    const repoInfo = parseGitHubPrUrl(targetUrl);

    console.log('📖 Reading system instructions profile components...');
    const systemPrompt = await getFileContents('SYSTEM_PROMPT.md', 'System prompt file');

    console.log('📡 Fetching core live Pull Request data from GitHub APIs...');
    let diffContent = "";
    let timelineComments = "";
    try {
        diffContent = await fetchLiveDiff(repoInfo.owner, repoInfo.repo, repoInfo.prNumber);
        timelineComments = await fetchLiveComments(repoInfo.owner, repoInfo.repo, repoInfo.prNumber);
    } catch (apiErr) {
    console.error("❌ Network execution error gathering live API payloads:", apiErr.message);
    // Give Windows libuv sockets 100ms to settle before exiting to prevent async.c crashes
    await new Promise(resolve => setTimeout(resolve, 100));
    process.exit(1);
}

    const userMessage = `
Instruction: The provided git diff may be highly truncated. If any variable references, base interface structures, imports, or options configurations are hidden from view, you MUST execute the read_github_files tool to capture the files full context before producing a final review.

<diff>
${diffContent}
</diff>

<thread>
${timelineComments}
</thread>
`.trim();

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
    ];

    const MAX_ITERATIONS = 5;
    let iteration = 0;
    let finalReportContent = '';

    console.log('\n🤖 Initiating Multi-turn Agentic Code Analysis Loop...');

    while (iteration < MAX_ITERATIONS) {
        iteration++;
        console.log(`\n🔄 [Iteration ${iteration}/${MAX_ITERATIONS}] Submitting context state to LLM...`);

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://senecapolytechnic.ca',
                    'X-Title': 'PR Advice Tooling Agent'
                },
                body: JSON.stringify({
                    model: 'google/gemini-2.5-flash',
                    messages: messages,
                    tools: tools, 
                    temperature: 0.1
                })
            });

            if (!response.ok) {
                const errorPayload = await response.text();
                throw new Error(`OpenRouter completion delivery failed (${response.status}): ${errorPayload}`);
            }

            const data = await response.json();
            const assistantMessage = data.choices[0].message;

            if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
                console.log('✨ Model has concluded its research loops. Final report captured successfully.');
                finalReportContent = assistantMessage.content;
                break;
            }

            console.log(`🎯 Tool Call Detected! Model requested ${assistantMessage.tool_calls.length} function invocation(s):`);
            messages.push(assistantMessage);

            for (const toolCall of assistantMessage.tool_calls) {
                if (toolCall.function.name === 'read_github_files') {
                    const parsedArgs = JSON.parse(toolCall.function.arguments);
                    
                    // Call the dynamic repository file loader tool
                    const toolExecutionResult = await readGitHubFiles(parsedArgs.files);

                    messages.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        content: toolExecutionResult
                    });
                }
            }

        } catch (loopError) {
            console.error('❌ Critical runtime exception encountered inside agent cycle:', loopError.message);
            process.exit(1);
        }
    }

    console.log("\n================ SENIOR ENGINEER REVIEW REPORT ================");
    console.log(finalReportContent);
    console.log("===============================================================");
}

main().catch(async (err) => {
    console.error("❌ Fatal unhandled framework operational error caught:", err);
    await new Promise(resolve => setTimeout(resolve, 100));
    process.exit(1);
});