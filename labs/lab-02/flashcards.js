#!/usr/bin/env node

import { parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';
import OpenAI from 'openai';

async function main() {
    // 1. Print the header identity first thing
    printHeader();

    // 2. Parse and validate arguments
    const { notesPath, cards } = parseArguments();

    // 3. Ensure the environment API key is loaded
    const apiKey = validateApiKey();

    // 4. Read the target files into memory strings
    console.log('📖 Reading prompt and notes files...');
    const systemPrompt = await getFileContents('SYSTEM_PROMPT.md', 'System prompt file');
    const notesContent = await getFileContents(notesPath, 'Notes file');

    // 5. Build the User Prompt (Sandwich technique to reinforce critical constraints)
    const userPrompt = `
[INSTRUCTION]
Generate exactly ${cards} unique ACE flashcards based ONLY on the text inside the <course_notes> tags below.
Strictly adhere to the formatting structures, acronym expansions, direct-quote evidence requirements, and student-voice rules defined in your system prompt.

<course_notes>
${notesContent}
</course_notes>

[REMINDER OF CRITICAL RULES]
1. Count: You must output exactly ${cards} cards. If the notes are insufficient, extract what you can and stop.
2. Formatting: Output each card using the exact '=== CARD [number] ===' block structures. Do not add conversational introductions or conclusions outside these blocks.
3. Acronyms: All acronyms used in the CHALLENGE field MUST be fully expanded.
4. Hallucination Guard: Every piece of information must trace directly to a quote inside <course_notes>.
`.trim();

    // 6. Initialize OpenAI client configured for OpenRouter
    const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: apiKey,
        defaultHeaders: {
            "HTTP-Referer": "https://github.com/seneca-polytechnic",
        }
    });

    try {
        console.log(`🤖 Requesting ${cards} flashcards from OpenRouter...`);
        
        const response = await openai.chat.completions.create({
            model: "nvidia/nemotron-3-super-120b-a12b:free", 
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.1, 
        });

        if (!response.choices || response.choices.length === 0) {
            throw new Error("The AI returned an empty response.");
        }

        const cardsResult = response.choices[0].message.content;
        
        // 7. Extract and Display the Cards
        const cardRegex = /=== CARD \d+ ===.*?===/gs;
        const foundCards = cardsResult.match(cardRegex);

        if (!foundCards) {
            console.error('❌ Error: No formatted cards found in the LLM output.');
            console.log('\n--- Raw Response for Debugging ---');
            console.log(cardsResult);
            process.exit(1);
        }

        console.log(`\n✅ Successfully generated and parsed ${foundCards.length} flashcard(s):\n`);
        
        foundCards.forEach((card) => {
            console.log(card);
            console.log(); 
        });

    } catch (error) {
        if (error.status === 429) {
            console.error("⚠️ Rate limit reached. Wait a minute before trying again.");
        } else {
            console.error("❌ LLM Error:", error.message);
        }
        process.exit(1);
    }
}

/**
 * Reads a file completely into a string or safely exits on error
 */
async function getFileContents(path, description) {
  try {
    return await readFile(path, 'utf-8');
  } catch (err) {
    console.error(`❌ Error: ${description} not found or unreadable at: ${path}`);
    console.error(`   ${err.message}`);
    process.exit(1);
  }
}

/**
 * Prints student identification header
 */
function printHeader() {
    const studentName = "Luke Olsen Tristan Ramos"; 
    const studentID = "143552222";
    
    const now = new Date();
    const datePart = now.toISOString().split('T')[0];
    const timePart = now.toTimeString().split(' ')[0];
    const runDate = `${datePart} ${timePart}`;

    console.log(`flashcards: Developed by ${studentName} - ${studentID}`);
    console.log(`Run Date: ${runDate}`);
    console.log("-".repeat(62));
}

/**
 * Parses and validates command line arguments using node:util
 */
function parseArguments() {
  const options = {
    cards: {
      type: 'string',
      short: 'c',
      default: '3',
    },
  };

  let values, positionals;
  try {
    ({ values, positionals } = parseArgs({ options, allowPositionals: true }));
  } catch (err) {
    console.error('❌ Error parsing arguments:', err.message);
    process.exit(1);
  }

  if (positionals.length === 0) {
    console.error('❌ Error: Please provide a path to notes file');
    console.error('Usage: node flashcards.js <notes-path> [--cards N]');
    process.exit(1);
  }

  const notesPath = positionals[0];
  const cards = parseInt(values.cards, 10);

  if (isNaN(cards) || cards < 1 || cards > 5) {
    console.error('❌ Error: --cards must be an integer between 1 and 5');
    process.exit(1);
  }

  return { notesPath, cards };
}

/**
 * Validates that OpenRouter API key is set
 */
function validateApiKey() {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
        console.error("❌ Error: OPENROUTER_API_KEY not found");
        console.error("Please ensure your .env file exists and contains the key.");
        process.exit(1);
    }

    const maskedKey = apiKey.length > 10 ? `${apiKey.slice(0, 7)}...` : "***";
    console.log(`✅ API Key loaded: ${maskedKey}`);

    return apiKey;
}

main();