/**
 * @file flashcard-generator.ts
 * @description Core AI execution service layout layer. Leverages the OpenAI SDK 
 * structured response formatting mechanics to cleanly extract structured JSON 
 * payload data models without brittle text parsing hacks.
 * Coursework: Lab 04 - AI For Programmers (Seneca Polytechnic)
 * Author: Luke Olsen Tristan Ramos - 143552222
 */

import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadEnvFile } from 'node:process';

// resolve '../../.env' relative to the directory of the current file
loadEnvFile(path.resolve(import.meta.dirname, '../../.env'));

// Now process.env.OPENROUTER_API_KEY will be populated correctly!
const apiKey = process.env.OPENROUTER_API_KEY;

// Import your Zod schema definitions from your local schemas file
import { FlashcardResponseSchema } from './schemas.js';

// Configure and initialize the client interface pointing to the OpenRouter gateway socket
const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

/**
 * Generates flashcards from the provided notes using Structured Outputs.
 * @param notes - The raw text content of the target source documentation
 * @param cards - The desired volume count of flashcards to extract
 * @returns A Promise resolving to the validated, structural JSON output object
 */
export async function generateFlashcards(notes: string, cards: number) {
  try {
    // 1. Load the structured system profile rules into local operational memory
    const promptPath = path.join(process.cwd(), 'SYSTEM_PROMPT.md');
    const systemPrompt = await readFile(promptPath, 'utf-8');

    // 2. Dynamically compile a specific contextual prompt payload string for the user target run
    const userPrompt = `Please parse the following course notes data carefully and extract exactly ${cards} high-quality, conceptual flashcards matching the required structured criteria layout constraints.\n\n[START OF NOTES]\n${notes}\n[END OF NOTES]`;

    // 3. Dispatch the parsing payload parameters directly to the OpenRouter completion endpoint
    const completion = await client.chat.completions.create({
      // Utilizing the high-capacity token pipeline profile to parse heavy technical blocks cleanly
      model: 'nvidia/nemotron-3-super-120b-a12b:free',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      // Enforce response structuring rules directly using the native Zod validation schema format helper
      response_format: zodResponseFormat(FlashcardResponseSchema, 'flashcard_response'),
    });

    // 4. Extract and verify the structurally validated JSON layout object
    const responseMessage = completion.choices[0].message;

    if ('parsed' in responseMessage && responseMessage.parsed) {
      return responseMessage.parsed;
    }

    // Fallback parsing logic string manipulation routine if provider fails to bind structural helpers natively
    if (responseMessage.content) {
      return JSON.parse(responseMessage.content.trim());
    }

    throw new Error('The upstream API gateway response payload did not present any structural text or parsed JSON records.');

  } catch (error: any) {
    console.error('❌ Generation Engine Execution Failure:', error.message);
    throw new Error(`AI Core Pipeline Generation Failure: ${error.message}`);
  }
}