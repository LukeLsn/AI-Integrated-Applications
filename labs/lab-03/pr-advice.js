#!/usr/bin/env node
// to run, go to the folder containing this file then:
// node --env-file=../../.env pr-advice.js https://github.com/microsoft/vscode/pull/289801

import { parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';

async function main() {
    // 1. Print the student assignment header identity first thing
    printHeader();

    // 2. Parse and validate the GitHub Pull Request URL input argument
    const { targetUrl } = parseArguments();

    // 3. Ensure the environment OpenRouter API key is loaded
    const apiKey = validateApiKey();

    // 4. Run Step 1: Parse the string to pull down domains and extract layout paths
    const repoInfo = parseGitHubPrUrl(targetUrl);

    // 5. Read the target static configurations and prompts into memory strings
    console.log('📖 Reading system instructions file...');
    const systemPrompt = await getFileContents('SYSTEM_PROMPT.md', 'System prompt file');

    // 6. Run Step 2 & Step 3: Fetch the underlying code structural data streams
    const diffContent = await fetchAndTruncateDiff(repoInfo.owner, repoInfo.repo, repoInfo.prNumber);
    const timelineComments = await fetchPrComments(repoInfo.owner, repoInfo.repo, repoInfo.prNumber);

    // 7. Step 4: Format the structural User Prompt Payload using requested delimiters
    const userMessage = buildUserMessage(diffContent, timelineComments);

    // 8. Step 5: Execute Chat Completion payload transmission to OpenRouter
    console.log('\n⏳ Analyzing data structures... Requesting Senior Review Report...');
    const finalReportMarkdown = await generatePrAdvice(apiKey, systemPrompt, userMessage);

    // 9. Display the generated evaluation out cleanly to the user terminal
    console.log('\n================ SENIOR ENGINEER REVIEW REPORT ================');
    console.log(finalReportMarkdown);
    console.log('===============================================================');
}

/**
 * Step 1: Confirms the URL's origin and parses the path to extract elements
 */
function parseGitHubPrUrl(urlString) {
    try {
        const parsedUrl = new URL(urlString.trim());

        if (parsedUrl.origin !== 'https://github.com') {
            throw new Error(`Invalid origin: Expected 'https://github.com' but got '${parsedUrl.origin}'`);
        }

        const pathSegments = parsedUrl.pathname.split('/').filter(segment => segment.length > 0);

        if (pathSegments.length !== 4 || pathSegments[2] !== 'pull') {
            throw new Error("URL structure is valid for GitHub, but it is not a standard Pull Request path.");
        }

        const owner = pathSegments[0];
        const repo = pathSegments[1];
        const prNumber = parseInt(pathSegments[3], 10);

        if (isNaN(prNumber)) {
            throw new Error("Could not parse a valid numeric Pull Request identifier from the URL path.");
        }

        return { owner, repo, prNumber };
    } catch (error) {
        console.error(`❌ URL Parsing Error: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Step 2: Fetches the raw DIFF stream and applies a character length limit buffer
 */
async function fetchAndTruncateDiff(owner, repo, prNumber) {
    const diffUrl = `https://github.com/${owner}/${repo}/pull/${prNumber}.diff`;
    const MAX_CHARACTERS = 95000;

    try {
        console.log(`📥 Fetching raw code changes from: ${diffUrl}`);
        const response = await fetch(diffUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch patch/diff stream files. Status: ${response.status}`);
        }

        let diffText = await response.text();

        if (diffText.length > MAX_CHARACTERS) {
            console.warn(`⚠️  [Warning]: This Pull Request contains a massive code modification footprint!`);
            console.warn(`Truncating text payload size down to keep within the safe target token capacity.`);
            diffText = diffText.slice(0, MAX_CHARACTERS) + "\n...[Diff Truncated]...";
        }

        return diffText;
    } catch (error) {
        console.error(`❌ Network Retrieval Error: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Step 3: Fetches the timeline comments payload directly using the GitHub REST API
 */
async function fetchPrComments(owner, repo, prNumber) {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;

    try {
        console.log(`💬 Fetching conversation timeline metrics from GitHub REST API...`);
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'AIP444-Lab-03',
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        if (!response.ok) {
            if (response.status === 403) {
                throw new Error("403 Forbidden. You have likely exceeded GitHub's 60 requests/hour unauthenticated limit.");
            }
            throw new Error(`GitHub API returned response failure code: ${response.status}`);
        }

        const data = await response.json();

        return data.map((item) => ({
            username: item.user.login,
            body: item.body,
            date: item.updated_at,
        }));
    } catch (error) {
        console.error(`❌ Context API Retrieval Error: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Step 4: Constructs the contextually encapsulated user prompt string payload
 */
function buildUserMessage(diffText, commentsArray) {
    let message = "Here is the Pull Request data for your senior engineer review:\n\n";
    
    // Inject code changes bounded within a fenced code block explicitly tagged as diff
    message += "```diff\n" + diffText + "\n```\n\n";
    
    // Wrap conversation history blocks neatly using clear XML tags
    message += "<thread>\n";
    for (const comment of commentsArray) {
        message += `  <comment username="${comment.username}" date="${comment.date}">\n`;
        message += `    ${comment.body}\n`;
        message += "  </comment>\n";
    }
    message += "</thread>";
    
    return message;
}

/**
 * Step 5: Handles standard chat completion fetch routines directly with OpenRouter
 */
async function generatePrAdvice(apiKey, systemPrompt, userMessage) {
    const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
    
    // BACKUP STRATEGY: If Nemotron is offline/overloaded, swap this string to:
    // "meta-llama/llama-3-8b-instruct:free" OR "google/gemini-2.5-flash-lite"
    const MODEL_NAME = "nvidia/nemotron-3-super-120b-a12b:free";

    try {
        const payload = {
            model: MODEL_NAME,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
            temperature: 0.1
        };

        const response = await fetch(OPENROUTER_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "https://github.com/seneca-polytechnic",
                "X-Title": "AIP444-Lab-03-Explainer"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            throw new Error(`OpenRouter Request Failed (${response.status}): ${errorDetails}`);
        }

        const jsonResponse = await response.json();

        // Robust Guardrail: Prevent crashing if the provider returns an error object
        if (!jsonResponse.choices || jsonResponse.choices.length === 0) {
            if (jsonResponse.error) {
                throw new Error(`OpenRouter API Error: ${jsonResponse.error.message} (Code: ${jsonResponse.error.code})`);
            }
            throw new Error(`Unexpected API payload layout: ${JSON.stringify(jsonResponse)}`);
        }

        return jsonResponse.choices[0].message.content;

    } catch (error) {
        console.error(`❌ Chat Completion Request Error: ${error.message}`);
        // Friendly recovery hint printed right to the terminal console
        if (error.message.includes("OpenRouter API Error") || error.message.includes("429")) {
            console.log("\n💡 Senior Dev Tip: The free model endpoint is likely busy right now.");
            console.log("Open 'pr-advice.js' and try changing MODEL_NAME to 'meta-llama/llama-3-8b-instruct:free' to bypass the bottleneck!\n");
        }
        process.exit(1);
    }
}

/**
 * Reads any targeting system documentation file safely into runtime text memory
 */
async function getFileContents(path, description) {
    try {
        return await readFile(path, 'utf-8');
    } catch (err) {
        console.error(`❌ Error: ${description} not found or unreadable at location: ${path}`);
        process.exit(1);
    }
}

/**
 * Prints mandatory student verification identifiers block
 */
function printHeader() {
    const studentName = "Luke Olsen Tristan Ramos"; 
    const studentID = "143552222";
    
    const now = new Date();
    const runDate = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;

    console.log(`pr-advice: Developed by ${studentName} - ${studentID}`);
    console.log(`Run Date: ${runDate}`);
    console.log("-".repeat(62));
}

/**
 * Parses and verifies positional command-line string array configurations
 */
function parseArguments() {
    let positionals;
    try {
        ({ positionals } = parseArgs({ allowPositionals: true }));
    } catch (err) {
        console.error('❌ Error parsing CLI parameters:', err.message);
        process.exit(1);
    }

    if (positionals.length === 0) {
        console.error('❌ Error: Missing mandatory argument target URL string.');
        console.error('Usage: node pr-advice.js <github-pr-url>');
        process.exit(1);
    }

    return { targetUrl: positionals[0] };
}

/**
 * Confirms system environment key configurations exist before launching fetches
 */
function validateApiKey() {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
        console.error("❌ Error: OPENROUTER_API_KEY environment parameter missing.");
        console.error("Please double check that your .env structure exists and holds a valid token flag.");
        process.exit(1);
    }

    const maskedKey = apiKey.length > 10 ? `${apiKey.slice(0, 7)}...` : "***";
    console.log(`✅ OpenRouter API Key configuration resolved: ${maskedKey}`);

    return apiKey;
}

main();