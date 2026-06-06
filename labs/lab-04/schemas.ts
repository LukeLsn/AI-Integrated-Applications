/**
 * @file schemas.ts
 * @description schema used to structure the format well
 */

import * as z from 'zod';

/**
 * Flashcard Structure
 * Captures individual flashcard element metrics with strict string type declarations.
 */
export const FlashcardSchema = z.object({
  application: z.string().describe(
    "A 1-2 SENTENCES real-world workplace or technical task where this specific concept is critically needed."
  ),
  challenge: z.string().describe(
    "A specific problem to solve in the scenario. All technical abbreviations or acronyms MUST BE completely expanded to full words."
  ),
  answer: z.string().describe(
    "The correct engineering solution paired with a brief, clear conceptual explanation."
  ),
  evidence: z.string().describe(
    "A DIRECT, EXACT quote extracted verbatim from the provided source text notes supporting this flashcard."
  ),
  misconception: z.string().describe(
    "A specific quote or statement reflecting what a junior developer or student might incorrectly assume or believe."
  ),
  correction: z.string().describe(
    "An analytical breakdown explaining why the misconception is wrong, EXPLICITLY citing the original text notes."
  ),
});

/**
 * API Root Level Array Object Contract
 */
export const FlashcardResponseSchema = z.object({
  flashcards: z.array(FlashcardSchema).describe(
    "A structured collection list containing the generated conceptual flashcards."
  ),
});

export type Flashcard = z.infer<typeof FlashcardSchema>;
export type FlashcardResponse = z.infer<typeof FlashcardResponseSchema>;