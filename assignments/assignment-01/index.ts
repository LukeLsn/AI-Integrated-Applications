import path from 'path';
import dotenv from 'dotenv';
import { callReviewer } from './reviewer';
import { judge } from './judge';
import fs from 'fs';
import { execSync } from 'child_process';

// FIX: Updated path to find your .env file in the parent 'AI For Programmers' folder
dotenv.config({ path: path.resolve(__dirname, './.env') });

const args = process.argv.slice(2);
const isDebug = args.includes('--debug');
const fileFlagIndex = args.indexOf('--file');
const fileName = fileFlagIndex !== -1 ? args[fileFlagIndex + 1] : null;

async function runReview() {
  let inputData: string;

  if (fileName) {
    if (!fs.existsSync(fileName)) {
      console.error(`Error: File ${fileName} not found.`);
      process.exit(1);
    }
    inputData = fs.readFileSync(fileName, 'utf-8');
  } else {
    try {
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

  // FIX: Sequential reviews to avoid RateLimit 429
  console.log("Starting Security Review...");
  const report1 = await callReviewer('Security', inputData, isDebug);
  
  console.log("Starting Maintainability Review...");
  const report2 = await callReviewer('Maintainability', inputData, isDebug);

  // 3. Synthesis
  console.log("Synthesizing final report...");
  const finalReport = await judge(report1, report2);
  
  const outputFilename = `review-${new Date().toISOString().replace(/:/g, '-')}.html`;
  fs.writeFileSync(outputFilename, finalReport);
  console.log(`Review complete. Report saved to ${outputFilename}`);
}

runReview().catch(console.error);