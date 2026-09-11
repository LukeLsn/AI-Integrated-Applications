import { ChromaClient } from 'chromadb';

async function verifyDb() {
  const client = new ChromaClient({
    host: 'localhost',
    port: 8000,
  });

  try {
    // Connect to the specific collection we built in our indexer
    const collection = await client.getCollection({
      name: 'node-docs',
    });

    const count = await collection.count();
    // Fetch a tiny sample to prove documents are structurally sound
    const sample = await collection.get({ limit: 1 });

    console.log('--- DATABASE VERIFICATION ---');
    console.log(`📊 Total records stored: ${count}`);
    console.log('👀 Sample Data metadata structure:');
    console.log(JSON.stringify(sample.metadatas[0], null, 2));
    console.log('-----------------------------');

  } catch (error) {
    console.error('❌ Error reading from Chroma database:', error.message);
    console.log('Make sure your Python server is running and the indexer has successfully executed first!');
  }
}

verifyDb();