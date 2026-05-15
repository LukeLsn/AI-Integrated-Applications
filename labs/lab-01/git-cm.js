#!/usr/bin/env node

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
}

// Main Execution
printHeader();
validateApiKey();