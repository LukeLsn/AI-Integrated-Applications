import { ChromaClient, type EmbeddingFunction } from 'chromadb';
import OpenAI from 'openai';
import { rerankDocuments } from './query.js';
import 'dotenv/config';
import path from 'path';

import { loadEnvFile } from 'node:process';

try {
    loadEnvFile(path.resolve(import.meta.dirname, '../../.env'));
} catch (envErr) {
    // Graceful warning if the .env file isn't found at that exact upward path
    console.warn("⚠️ Note: Native .env file could not be loaded at the specified path. Relying on shell variables.");
}

class OpenRouterEmbeddingFunction implements EmbeddingFunction {
  private openai: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'openai/text-embedding-3-small') {
    this.model = model;
    this.openai = new OpenAI({ apiKey, baseURL: 'https://openrouter.ai/api/v1' });
  }

  async generate(texts: string[]): Promise<number[][]> {
    const response = await this.openai.embeddings.create({ model: this.model, input: texts });
    const sorted = response.data.sort((a, b) => a.index - b.index);
    return sorted.map((item) => item.embedding);
  }
}

async function runRAGPipeline() {
  const userQuestion = process.argv.slice(2).join(' ');
  if (!userQuestion) {
    console.log('🚨 Usage: npx tsx node-ask.ts "<your node.js question here>"');
    process.exit(1);
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('❌ Missing environment security key tokens.');
    process.exit(1);
  }

  // Initialize external proxy connection services
  const openai = new OpenAI({ apiKey, baseURL: 'https://openrouter.ai/api/v1' });
  const chroma = new ChromaClient({ host: 'localhost', port: 8000 });
  
  const collection = await chroma.getOrCreateCollection({
    name: 'node-docs',
    embeddingFunction: new OpenRouterEmbeddingFunction(apiKey)
  });

  // 1. Stage 1 Retrieval: Query vector database collection arrays
  const searchCandidates = await collection.query({
    queryTexts: [userQuestion],
    nResults: 25
  });

  if (!searchCandidates.ids[0] || searchCandidates.ids[0].length === 0) {
    console.log("I don't have enough information inside my storage array to answer that safely.");
    return;
  }

  const flattened = searchCandidates.ids[0].map((id, index) => ({
    id,
    document: searchCandidates.documents[0][index]!,
    metadata: searchCandidates.metadatas[0][index] as any,
    distance: searchCandidates.distances[0][index]!
  }));

  // 2. Stage 2 Retrieval: Rerank matching contexts down to the highest top 4 records
  const textStrings = flattened.map(f => f.document);
  const topContexts = await rerankDocuments(userQuestion, textStrings, flattened, apiKey, 4);

  // Print sources to standard error for debugging transparency tracking
process.stderr.write('📋 Grounding Sources Utilized:\n');
  topContexts.forEach(c => process.stderr.write(`  - File: ${c.source} | Path Context: ${c.breadcrumb}\n`));
  process.stderr.write('\n⚡ Dispatching grounded knowledge model parameters...\n\n');
  // 3. Dynamic XML Prompt Augmentation Construction
  let contextXmlBlock = '<context>\n';
  topContexts.forEach(c => {
    contextXmlBlock += `  <doc source="${c.source}" breadcrumb="${c.breadcrumb}">\n    ${c.document}\n  </doc>\n`;
  });
  contextXmlBlock += '</context>';

  const systemInstructions = `You are ask-node, an expert technical assistant specializing in the Node.js API runtime ecosystem.

Here is an authentic excerpt of official documentation context:
${contextXmlBlock}

Instructions:
1. Answer the user's question based strictly and ONLY on the provided XML <context> blocks above.
2. If the answer cannot be confidently formulated using ONLY the details inside the context block, respond with: "I don't have enough information to answer that."
3. Do not assume facts or incorporate external knowledge cutoffs.
4. Explicitly cite the source file metadata (e.g. fs.md, path.md) when referencing features or code details.`;

  // 4. Generation Phase: Fire execution parameters over to the designated inference tier
  const completion = await openai.chat.completions.create({
    model: 'google/gemini-3.1-flash-lite-preview',
    messages: [
      { role: 'system', content: systemInstructions },
      { role: 'user', content: userQuestion }
    ],
    temperature: 0.1 // Kept low to enforce strict adherence to documentation boundaries
  });

  // Print final output response straight to stdout
  console.log(completion.choices[0].message.content);
}

runRAGPipeline().catch(console.error);