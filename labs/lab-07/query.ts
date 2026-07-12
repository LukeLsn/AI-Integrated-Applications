import { ChromaClient, type EmbeddingFunction } from 'chromadb';
import OpenAI from 'openai';
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

// Generic interface blueprint wrapping cross-encoder results layout
export interface RerankedDocument {
  id: string;
  document: string;
  source: string;
  breadcrumb: string;
  chromaDistance: number;
  chromaSimilarity: number;
  rerankScore: number;
}

/**
 * Sends candidates through the Cross-Encoder pipeline to optimize relevancy matching
 */
export async function rerankDocuments(
  query: string,
  documents: string[],
  originalResults: any[],
  apiKey: string,
  topN: number = 5
): Promise<RerankedDocument[]> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'cohere/rerank-v3.5',
      // The OpenRouter format for Rerank models expects parameters structured along standard arrays
      parameters: {
        query: query,
        documents: documents,
        top_n: topN
      }
    })
  });

  const data = await response.json();
  
  // Handle native openrouter rerank response format or mock structural maps
  if (data.results) {
    return data.results.slice(0, topN).map((item: any) => {
      const idx = item.index;
      const distance = originalResults[idx].distance;
      return {
        id: originalResults[idx].id,
        document: originalResults[idx].document,
        source: originalResults[idx].metadata.source,
        breadcrumb: originalResults[idx].metadata.breadcrumb,
        chromaDistance: distance,
        chromaSimilarity: 1 - distance,
        rerankScore: item.relevance_score
      };
    });
  }
  
  // Fallback map if structure passes flat array returns
  return originalResults.slice(0, topN).map(r => ({
    id: r.id, document: r.document, source: r.metadata.source, breadcrumb: r.metadata.breadcrumb,
    chromaDistance: r.distance, chromaSimilarity: 1 - r.distance, rerankScore: 1
  }));
}

async function main() {
  const queryText = process.argv.slice(2).join(' ');
  if (!queryText) {
    console.log('🚨 Usage: npx tsx query.ts "<your search query statement>"');
    process.exit(1);
  }

  const apiKey = process.env.OPENROUTER_API_KEY!;
  const client = new ChromaClient({ host: 'localhost', port: 8000 });
  const collection = await client.getOrCreateCollection({
    name: 'node-docs',
    embeddingFunction: new OpenRouterEmbeddingFunction(apiKey)
  });

  console.log(`🔎 Searching Chroma Database for top 25 chunks matching: "${queryText}"`);
  
  const rawQueryResults = await collection.query({
    queryTexts: [queryText],
    nResults: 25,
  });

  if (!rawQueryResults.ids[0] || rawQueryResults.ids[0].length === 0) {
    console.log('❌ No documents found.');
    return;
  }

  // Format Chroma structure records into flat array layouts
  const flattenedCandidates = rawQueryResults.ids[0].map((id, index) => ({
    id: id,
    document: rawQueryResults.documents[0][index]!,
    metadata: rawQueryResults.metadatas[0][index] as any,
    distance: rawQueryResults.distances[0][index]!
  }));

  const textDocsOnly = flattenedCandidates.map(c => c.document);

  console.log('⚡ Reranking candidates using cohere/rerank-v3.5...');
  const reranked = await rerankDocuments(queryText, textDocsOnly, flattenedCandidates, apiKey, 5);

  console.log('\n🎯 --- Top 5 Reranked Results ---');
  reranked.forEach((doc, idx) => {
    console.log(`\n[Rank ${idx + 1}] Relevance Score: ${doc.rerankScore.toFixed(4)} | Chroma Similarity: ${doc.chromaSimilarity.toFixed(4)}`);
    console.log(`📍 Location: ${doc.breadcrumb} (${doc.source})`);
    console.log(`📝 Text Snippet:\n${doc.document.substring(0, 180).replace(/\n/g, ' ')}...`);
    console.log('-'.repeat(50));
  });
}

// Only run standalone execution pipeline if targeted directly
if (process.argv[1].endsWith('query.ts')) {
  main().catch(console.error);
}