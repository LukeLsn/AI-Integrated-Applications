import path from 'node:path';
import fs from 'node:fs/promises';
import { ChromaClient, type EmbeddingFunction } from 'chromadb';
import OpenAI from 'openai';
import { chunkMarkdown } from './chunker.js';
import 'dotenv/config';

import { loadEnvFile } from 'node:process';

try {
    loadEnvFile(path.resolve(import.meta.dirname, '../../.env'));
} catch (envErr) {
    // Graceful warning if the .env file isn't found at that exact upward path
    console.warn("⚠️ Note: Native .env file could not be loaded at the specified path. Relying on shell variables.");
}

// 1. Custom Embedding Function matching cross-language schema targets
class OpenRouterEmbeddingFunction implements EmbeddingFunction {
  private openai: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'openai/text-embedding-3-small') {
    this.model = model;
    this.openai = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });
  }

  async generate(texts: string[]): Promise<number[][]> {
    const response = await this.openai.embeddings.create({
      model: this.model,
      input: texts,
    });

    // Sort by index explicitly to maintain exact array ordering sequences
    const sorted = response.data.sort((a, b) => a.index - b.index);
    return sorted.map((item) => item.embedding);
  }
}

const { OPENROUTER_API_KEY } = process.env;
if (!OPENROUTER_API_KEY) {
  console.error('❌ Error: Missing OPENROUTER_API_KEY environment variable');
  process.exit(1);
}

// Spin up client connection targeting the background local instance process
const client = new ChromaClient({
  host: 'localhost',
  port: 8000,
});

const embeddingFunction = new OpenRouterEmbeddingFunction(OPENROUTER_API_KEY);

async function main() {
  console.log('📦 Initializing Chroma collection connection...');
  
  // Use cosine distance matching constraints
  const collection = await client.getOrCreateCollection({
    name: 'node-docs',
    embeddingFunction,
    configuration: {
      hnsw: {
        space: 'cosine',
      },
    },
  });

  const docsDir = path.join('.', 'docs');
  let files: string[] = [];
  
  try {
    files = await fs.readdir(docsDir);
  } catch (err) {
    console.error(`❌ Error: Could not read directory "${docsDir}". Run data staging extraction first.`);
    process.exit(1);
  }

  for (const file of files) {
    if (!file.endsWith('.md')) continue;

    console.log(`⏳ Processing: ${file}...`);
    const text = await fs.readFile(path.join(docsDir, file), 'utf-8');

    // Generate hierarchy-aware chunks injecting breadcrumb contexts
    const chunks = chunkMarkdown(text, file);
    if (chunks.length === 0) continue;

    const ids = chunks.map((c) => c.id);
    const documents = chunks.map((c) => c.content);
    const metadatas = chunks.map((c) => c.metadata);

    // Use .upsert() so executing this script repeatedly updates modifications safely
    await collection.upsert({
      ids,
      documents,
      metadatas,
    });
  }

  console.log('✅ Indexing cycle completely compiled!');
}

main().catch(console.error);