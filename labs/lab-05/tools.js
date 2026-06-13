import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Configurable constants according to Part 2 specifications
const CACHE_DIR = '.cache';
const MAX_LINE_LIMIT = 1000; 

/**
 * Fetches the raw file content from GitHub or pulls it from local disk cache.
 * Implements line-based truncation and error handling.
 * * @param {Array} filesArray - Array of file objects requested by the LLM
 * @returns {Promise<string>} Markdown-formatted string containing file contents or errors
 */
export async function readGitHubFiles(filesArray) {
    console.log(`\n💾 [Tool Executing] Processing access for ${filesArray.length} asset(s)...`);
    
    // Ensure cache directory exists securely
    await mkdir(CACHE_DIR, { recursive: true });
    
    let combinedResults = "";

    for (const file of filesArray) {
        // Fallback default according to Part 2 requirements
        const ref = file.ref || "main";
        const safeCacheName = `${file.owner}_${file.repo}_${ref}_${file.path.replace(/[\/\\:]/g, '_')}.cache`;
        const cacheFilePath = join(CACHE_DIR, safeCacheName);

        let fileContent = "";

        try {
            // 1. Try reading from the local disk cache
            fileContent = await readFile(cacheFilePath, 'utf-8');
            console.log(`   ⚡ Cache Hit: Retrieved [${file.path}] from local storage disk cache.`);
        } catch {
            // 2. Cache Miss: Fetch dynamically from the raw GitHub user content network layer
            // Formatting branch refs appropriately as instructed in Part 1
            const targetRef = (ref === "main" || ref === "master") ? `refs/heads/${ref}` : ref;
            const rawUrl = `https://raw.githubusercontent.com/${file.owner}/${file.repo}/${targetRef}/${file.path}`;
            
            console.log(`   🌐 Cache Miss: Contacting remote endpoint [${rawUrl}]...`);

            try {
                const response = await fetch(rawUrl);
                
                if (!response.ok) {
                    throw new Error(`GitHub HTTP response error status code: ${response.status}`);
                }
                
                fileContent = await response.text();
                
                // Commit raw downloaded file to disk cache to safeguard unauthenticated rate limits
                await writeFile(cacheFilePath, fileContent, 'utf-8');
            } catch (err) {
                console.error(`   ❌ Failed to resolve network target [${file.path}]:`, err.message);
                combinedResults += `\n\n### ❌ Error Fetching File: ${file.path}\nReason: ${err.message}\n`;
                continue;
            }
        }

        // 3. Handle Large Files (Part 2, Requirement 3)
        const lines = fileContent.split(/\r?\n/);
        const totalLinesCount = lines.length;

        if (totalLinesCount > MAX_LINE_LIMIT) {
            console.log(`   ✂️ Large file discovered (${totalLinesCount} lines). Truncating output content block to ${MAX_LINE_LIMIT} lines.`);
            const truncatedLines = lines.slice(0, MAX_LINE_LIMIT);
            fileContent = truncatedLines.join('\n');
            fileContent += `\n\n[File truncated: showing first ${MAX_LINE_LIMIT} of ${totalLinesCount} lines]`;
        }

        // Append results formatted in clean Markdown syntax block layout
        combinedResults += `\n\n--- Start of File: ${file.path} ---\n\`\`\`\n${fileContent}\n\`\`\`\n--- End of File: ${file.path} ---\n`;
    }

    return combinedResults;
}

/**
 * 📋 JSON Schema Definition block required for Tool-Calling Configuration
 */
export const tools = [
    {
        type: "function",
        function: {
            name: "read_github_files",
            description: "Fetches the full text content of one or more specific source files from a targeted repository path when the provided git diff lacks sufficient context to analyze function interfaces, imports, or referenced option properties.",
            parameters: {
                type: "object",
                properties: {
                    files: {
                        type: "array",
                        description: "An array of GitHub file objects specifying paths to download.",
                        items: {
                            type: "object",
                            properties: {
                                owner: { type: "string", description: "The username or organization account owning the repository." },
                                repo: { type: "string", description: "The repository name string." },
                                path: { type: "string", description: "The absolute relative path pointing to the source asset file inside the repository structure." },
                                ref: { type: "string", description: "Optional branch, tag name, or commit hash footprint string. Defaults to 'main'." }
                            },
                            required: ["owner", "repo", "path"]
                        }
                    }
                },
                required: ["files"]
            }
        }
    }
];