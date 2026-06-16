#!/usr/bin/env node
const { execSync } = require('child_process');

// This script fulfills the requirement to run via `node review.js`
// while leveraging `npx tsx` to handle your TypeScript files correctly.
const args = process.argv.slice(2).join(' ');
try {
    console.log("Starting Process now...");
    execSync(`npx tsx index.ts ${args}`, { stdio: 'inherit' });
} catch (error) {
  process.exit(1);
}