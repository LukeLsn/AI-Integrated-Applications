// test-tool.js
import { readGitHubFiles } from './tools.js';

async function test() {
    console.log('Testing read_github_files tool execution...\n');

    // Test with a known public repository file
    const filesToFetch = [
        {
            owner: 'microsoft',
            repo: 'vscode',
            path: 'package.json',
            ref: 'main',
        }
    ];

    console.log('Pass 1: Fetching file from remote GitHub server...');
    const startTime1 = Date.now();
    const contentPass1 = await readGitHubFiles(filesToFetch);
    const duration1 = Date.now() - startTime1;
    
    console.log(`Pass 1 Completed in ${duration1}ms\n`);
    console.log('--- CONTENT PREVIEW (First 250 characters) ---');
    console.log(contentPass1.slice(0, 250) + '\n...\n----------------------------------------------\n');

    console.log('Pass 2: Fetching same file again (Verifying Local Cache Optimization)...');
    const startTime2 = Date.now();
    const contentPass2 = await readGitHubFiles(filesToFetch);
    const duration2 = Date.now() - startTime2;

    console.log(`Pass 2 Completed in ${duration2}ms`);
    console.log(`Speed improvement: Cache saved ${duration1 - duration2}ms!\n`);
    
    if (contentPass2.includes('Source: Loaded from local system cache')) {
        console.log('SUCCESS: The enhancement disk cache is operating correctly.');
    } else {
        console.log('WARNING: Cache indicator not found in payload string output.');
    }
}

test().catch(err => {
    console.error('Direct test execution failed:', err);
});