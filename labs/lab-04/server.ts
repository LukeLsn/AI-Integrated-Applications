import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { timing } from 'hono/timing';
import { logger } from 'hono/logger';
import { zValidator } from '@hono/zod-validator';
import * as z from 'zod';
import { readdir, readFile } from 'node:fs/promises'; // Added readdir and readFile
import path from 'node:path';

import { generateFlashcards } from './flashcard-generator.js';

const app = new Hono();

app.use(logger(), timing());
app.use('/api/*', cors());

// Serve everything inside a 'public' folder as static web assets
app.use('/*', serveStatic({ root: './public' }));

/**
 * NEW ENDPOINT: GET /api/files
 * Scans the current workspace folder for markdown (.md) study notes
 */
app.get('/api/files', async (c) => {
  try {
    // Looks in the current working directory where your script runs
    const targetDir = process.cwd(); 
    const entries = await readdir(targetDir);
    
    // Filter down to only markdown files (.md)
    const markdownFiles = entries.filter(file => file.endsWith('.md'));

    return c.json({ files: markdownFiles });
  } catch (error: any) {
    return c.json({ error: 'Failed to scan files directory', details: error.message }, 500);
  }
});

/**
 * NEW ENDPOINT: GET /api/files/:filename
 * Fetches the raw text content of a specific file automatically
 */
app.get('/api/files/:filename', async (c) => {
  try {
    // 1. Grab the parameter name from the URL path pattern matching
    const filename = c.req.param('filename');
    
    // Safety check against basic directory traversal tricks (preventing absolute path escapes)
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return c.json({ error: 'Invalid filename security violation' }, 400);
    }

    // 2. Safely bind the variable into the node path resolver
    const targetFilePath = path.join(process.cwd(), filename);
    const content = await readFile(targetFilePath, 'utf-8');

    return c.json({ content });
  } catch (error: any) {
    // Updated error reference tracking to ensure strict clean variable scope lookup
    const filenameParam = c.req.param('filename');
    return c.json({ error: `Could not read file asset: ${filenameParam}`, details: error.message }, 500);
  }
});

const generateSchema = z.object({
  notes: z.string().min(1, "Field 'notes' is required."),
  cards: z.number().optional().default(3),
});

// REMAINING STRUCUTRED PATH FOR PROFESSOR: COMPLETELY UNTOUCHED & FUNCTIONAL
app.post('/api/generate', zValidator('json', generateSchema), async (c) => {
  try {
    const { notes, cards } = await c.req.valid('json');
    const result = await generateFlashcards(notes, cards);

    return c.json(result);
  } catch (error: any) {
    console.error('Server Error:', error);
    return c.json({ error: 'Failed to generate flashcards.', details: error.message }, 500);
  }
});

const port = 3000;
console.log(`🚀 Server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});