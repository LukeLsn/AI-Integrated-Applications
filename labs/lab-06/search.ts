#!/usr/bin/env node

//just run using npx search.ts


import path from 'node:path';
import { loadEnvFile } from 'node:process';
import readline from 'node:readline';
import { loadDatabase, searchProducts } from './utils.js';

// Resolve and load environment variables safely from our root path configuration 
try {
    loadEnvFile(path.resolve(import.meta.dirname, '../../.env'));
} catch (e) {
    // Relying on existing environment variables or shell configuration fallback if missing
}

function printHeader() {
    console.clear();
    console.log("==============================================================");
    const studentName = "Luke Olsen Tristan Ramos"; 
    const studentID = "AIP444-Lab06"; 
    console.log(`🤖 SEMANTIC AI HYBRID ENGINE: Developed by ${studentName} (${studentID})`);
    console.log("🔍 Powered by: NVIDA Nemotron Embedding (Stage 1) + Cohere Rerank v3.5 (Stage 2)");
    console.log("==============================================================");
}

async function startSearchLoop() {
    printHeader();
    
    console.log("📂 Re-assembling multi-layer data matrices from local index pools...");
    let database: any[] = [];
    try {
        database = await loadDatabase();
        console.log(`✨ Hybrid system initialized. ${database.length} operational data structures loaded successfully.`);
    } catch (err: any) {
        console.error("❌ Fatal baseline index error gathering data snapshots:", err.message);
        process.exit(1);
    }

    // Set up active user interactive standard input terminal channel interfaces
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log("\n💡 Type your query or enter 'exit' / 'quit' to terminate the session.\n");

    const askQuery = () => {
        rl.question("👉 What are you looking for? ", async (query) => {
            const cleanQuery = query.trim();

            if (cleanQuery.toLowerCase() === 'exit' || cleanQuery.toLowerCase() === 'quit') {
                console.log("\n👋 Session completed. Powering down semantic index interfaces.\n");
                rl.close();
                return;
            }

            if (cleanQuery === '') {
                askQuery();
                return;
            }

            console.log("⏳ Dispatching vector similarity mapping pipelines & cross-encoder re-evaluations...");
            
            try {
                // Execute our two-stage search function utilizing our calibrated 0.20 threshold score
                const hits = await searchProducts(cleanQuery, database);

                if (hits.length === 0) {
                    console.log("\n🚫 I'm sorry, we don't have anything like that in stock.\n");
                } else {
                    console.log(`\n🎉 Found ${hits.length} matches:`);
                    hits.forEach((product, idx) => {
                        const rerank = product.rerankScore?.toFixed(2) || "0.00";
                        const vector = product.similarityScore?.toFixed(2) || "0.00";
                        const price = product.price ? `$${product.price.toFixed(2)}` : "N/A";
                        
                        console.log(`   ${idx + 1}. [Rerank: ${rerank} | Vector: ${vector}] ${product.title} - ${price}`);
                    });
                    console.log(""); // Empty layout dividing space padding
                }
            } catch (err: any) {
                console.error(`\n❌ Operational Pipeline Interrupt Error: ${err.message}\n`);
            }

            // Loop prompt iteratively
            askQuery();
        });
    };

    askQuery();
}

startSearchLoop().catch((err) => {
    console.error("❌ Uncaught operational application wrapper crash:", err);
    process.exit(1);
});