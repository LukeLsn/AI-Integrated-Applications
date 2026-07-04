#!/usr/bin/env node

import * as fs from 'node:fs';
import path from 'node:path';
import { loadEnvFile } from 'node:process';
import { serializeProduct } from './utils.js';

// Resolve and load the environment file relative to this file's directory
try {
    loadEnvFile(path.resolve(import.meta.dirname, '../../.env'));
} catch (envErr) {
    // Graceful warning if the .env file isn't found at that exact upward path
    console.warn("⚠️ Note: Native .env file could not be loaded at the specified path. Relying on shell variables.");
}

function printHeader() {
    console.log("==============================================================");
    const studentName = "Luke Olsen Tristan Ramos"; 
    const studentID = "AIP444-Lab06"; 
    const now = new Date();
    const runDate = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;

    console.log(`indexer: Developed by ${studentName} - ${studentID}`);
    console.log(`Run Date: ${runDate}`);
    console.log("==============================================================");
}

function validateApiKey(): string {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
        console.error("❌ Error: OPENROUTER_API_KEY environment parameter missing.");
        process.exit(1);
    }
    return apiKey;
}

function sanitizeTsvField(text: any): string {
    if (text === undefined || text === null) return '';
    return String(text).replace(/[\t\n\r]/g, " ");
}

// ============================================================================
// DYNAMIC WORKFLOW EXECUTION ENGINE
// ============================================================================
async function main() {
    printHeader();
    const apiKey = validateApiKey();

    console.log('📡 Fetching core live product data payloads from API channels...');
    let products: any[] = [];
    try {
        const response = await fetch("https://dummyjson.com/products?limit=200");
        if (!response.ok) {
            throw new Error(`Failed gathering product collection: ${response.statusText}`);
        }
        const data = await response.json();
        products = data.products || [];
        console.log(`✨ Successfully retrieved ${products.length} source products.`);
    } catch (apiErr: any) {
        console.error("❌ Network execution error gathering live API payloads:", apiErr.message);
        await new Promise(resolve => setTimeout(resolve, 100));
        process.exit(1);
    }

    // 1. Save original structural database snapshot
    console.log('💾 Writing structured product database snapshot [products.json]...');
    try {
        fs.writeFileSync("products.json", JSON.stringify(products, null, 2), "utf-8");
    } catch (fsErr: any) {
        console.error("❌ Critical file system write failure on products database:", fsErr.message);
        process.exit(1);
    }

    // 2. Perform semantic string serialization transformations
    console.log('📝 Executing semantic serialization on raw product entities...');
    const serializedTexts = products.map((product) => serializeProduct(product));

    // 3. Dispatch batch vectors from the model platform
    console.log('🤖 Dispatched single-batch embedding vector requests to OpenRouter...');
    let embeddings: any[] = [];
    try {
        const embedResponse = await fetch('https://openrouter.ai/api/v1/embeddings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://senecapolytechnic.ca',
                'X-Title': 'Vector Embedding Indexer'
            },
            body: JSON.stringify({
                model: 'nvidia/llama-nemotron-embed-vl-1b-v2:free',
                input: serializedTexts
            })
        });

        if (!embedResponse.ok) {
            const errorPayload = await embedResponse.text();
            throw new Error(`OpenRouter delivery failed (${embedResponse.status}): ${errorPayload}`);
        }

        const embedData = await embedResponse.json();
        embeddings = embedData.data || [];
    } catch (embedErr: any) {
        console.error("❌ Critical vector generation workflow error encountered:", embedErr.message);
        await new Promise(resolve => setTimeout(resolve, 100));
        process.exit(1);
    }

    // 4. Build and persist matrix index file
    console.log('💾 Compiling floating-point matrix coordinates index [vectors.tsv]...');
    try {
        const vectorLines = embeddings.map((item) => item.embedding.join("\t"));
        fs.writeFileSync("vectors.tsv", vectorLines.join("\n") + "\n", "utf-8");
    } catch (vectorFsErr: any) {
        console.error("❌ Failed writing vectors coordinate database:", vectorFsErr.message);
        process.exit(1);
    }

    // 5. Compile layout metadata schemas for external layout visualization nodes
    console.log('💾 Compiling sanitized visualization database schema [metadata.tsv]...');
    try {
        let metadataContent = "Title\tCategory\n";
        for (const product of products) {
            const cleanTitle = sanitizeTsvField(product.title);
            const cleanCategory = sanitizeTsvField(product.category);
            metadataContent += `${cleanTitle}\t${cleanCategory}\n`;
        }
        
        // Strict normalization so both files match line-for-line in the projector
        metadataContent = metadataContent.trim() + "\n";
        fs.writeFileSync("metadata.tsv", metadataContent, "utf-8");
    } catch (metaFsErr: any) {
        console.error("❌ Failed writing sanitized visualization schema:", metaFsErr.message);
        process.exit(1);
    }

    console.log("\n=================== INDEX CREATION COMPLETED ===================");
    console.log("✨ All downstream matrix nodes generated and stored successfully.");
    console.log("===============================================================");
}

main().catch(async (err) => {
    console.error("❌ Fatal unhandled framework operational error caught:", err);
    await new Promise(resolve => setTimeout(resolve, 100));
    process.exit(1);
});