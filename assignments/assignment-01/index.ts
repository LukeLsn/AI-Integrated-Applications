import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), './.env') });

import { callReviewer } from './reviewer.ts';
import { judge } from './judge.ts';
import fs from 'fs';
import { execSync } from 'child_process';

const args = process.argv.slice(2);
const isDebug = args.includes('--debug');
const fileFlagIndex = args.indexOf('--file');
const fileName = fileFlagIndex !== -1 ? args[fileFlagIndex + 1] : null;

async function runReview() {
  if (isDebug) console.log("[DEBUG] Starting review process...");
  let inputData: string;

  if (fileName) {
    if (!fs.existsSync(fileName)) {
      console.error(`Error: File ${fileName} not found.`);
      process.exit(1);
    }
    inputData = fs.readFileSync(fileName, 'utf-8');
    if (isDebug) console.log(`[DEBUG] Loaded file: ${fileName}`);
  } else {
    try {
      if (isDebug) console.log("[DEBUG] No file specified, checking git diff...");
      inputData = execSync('git diff --staged').toString();
      if (!inputData.trim()) {
        console.log("No staged changes found to review.");
        process.exit(0);
      }
    } catch (e) {
      console.error("Error: Not a git repository or no changes staged.");
      process.exit(1);
    }
  }

  if (isDebug) console.log("[DEBUG] Starting parallel review agents...");
  const [report1, report2] = await Promise.all([
    callReviewer('Security', inputData, isDebug, 'openai/gpt-oss-120b:free'),
    callReviewer('Maintainability', inputData, isDebug, 'poolside/laguna-xs.2:free')
  ]);

  if (isDebug) console.log("[DEBUG] Both reviewers finished. Synthesizing final report...");
  const finalReport = await judge(report1, report2, isDebug);
  
  const outputFilename = `review-${new Date().toISOString().replace(/:/g, '-')}.html`;
  fs.writeFileSync(outputFilename, finalReport);
  console.log(`Review complete. Report saved to ${outputFilename}`);
}

runReview().catch(console.error);