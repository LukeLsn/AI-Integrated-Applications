#!/usr/bin/env node

import { execSync } from 'node:child_process';
import OpenAI from 'openai';

/**
 * git-cm: Identity Header Script
 */

function printHeader() {
    // Replace these with your actual details
    const studentName = "Luke Olsen Tristan Ramos"; 
    const studentID = "143552222";
    
    // Format the current date: YYYY-MM-DD HH:MM:SS
    const now = new Date();
    const datePart = now.toISOString().split('T')[0];
    const timePart = now.toTimeString().split(' ')[0];
    const runDate = `${datePart} ${timePart}`;

    console.log(`git-cm: Developed by ${studentName} - ${studentID}`);
    console.log(`Run Date: ${runDate}`);
    console.log("-".repeat(62));
}

function validateApiKey() {
    // process.env looks for keys loaded into the system or via the --env-file flag
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
        console.error("❌ Error: OPENROUTER_API_KEY not found");
        console.error("Please ensure your .env file exists and contains the key.");
        process.exit(1); // Exit immediately with an error code
    }

    // Optional: Mask and show success for debugging
    const maskedKey = apiKey.length > 10 ? `${apiKey.slice(0, 7)}...` : "***";
    console.log(`✅ API Key loaded: ${maskedKey}`);

    return apiKey;
}

/**
 * Step 2: Git Integration
 * Runs 'git diff --staged' and captures output.
 */
function getStagedDiff() {
    try {
        // Run the command and capture output as a UTF-8 string
        const diff = execSync('git diff --staged').toString();

        if (!diff || diff.trim() === "") {
            console.log("❌ No staged changes found");
            process.exit(0); // Exit gracefully if nothing is staged
        }

        console.log(`✅ Diff found: ${diff.length} characters`);
        return diff;
    } catch (error) {
        console.error("❌ Error running git command:", error.message);
        process.exit(1);
    }
}

/**
 * Step 3: LLM Integration
 */
/**
 * Step 4: Parameter Tuning (Creative Mode)
 */
async function main() {
    printHeader();
    const apiKey = validateApiKey();
    const stagedDiff = getStagedDiff();

    // Check for the --creative flag in the command line arguments
    const is_creative = process.argv.includes('--creative');

    // 1. Set Temperature based on mode
    const temperature = is_creative ? 0.8 : 0.1;

    // 2. Set System Prompt based on mode
    const systemPrompt = is_creative 
        ? "You are a poetic 19th-century author. Summarize this git diff as a dramatic, fancy couplet. No Markdown, just plain text." 
        : "You are an LLM running in a CLI tool, which writes semantic commit messages for the user. You will be given a git diff. You must output ONLY the commit message using the Conventional Commits standard format (e.g., 'feat: add logging'). Respond in plain text suitable for pasting into git commit -m '...your commit message...'; just the plain text commit message with no Markdown, no rationale about why you chose it, etc.";

    const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: apiKey,
        defaultHeaders: {
            "HTTP-Referer": "https://github.com/seneca-polytechnic",
        }
    });

    try {
        console.log(`🤖 Consulting LLM (${is_creative ? "CREATIVE" : "NORMAL"} mode)...`);
        
        const response = await openai.chat.completions.create({
            model: "meta-llama/llama-3.2-3b-instruct:free",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: stagedDiff }
            ],
            temperature: temperature, // Apply the dynamic temperature
        });

    if (!response.choices || response.choices.length === 0) {
        throw new Error("The AI returned an empty response. Try running it again.");
    }

        const commitMessage = response.choices[0].message.content.trim();
        
        console.log("\nSuggested Message:");
        console.log("-".repeat(62));
        console.log(commitMessage);
        console.log("-".repeat(62));

    } catch (error) {
        if (error.status === 429) {
            console.error("⚠️ Rate limit reached. Wait a minute before trying again.");
        } else {
            console.error("❌ LLM Error:", error.message);
        }
        process.exit(1);
    }
}

main();