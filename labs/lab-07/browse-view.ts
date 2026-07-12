import { ChromaClient } from 'chromadb';

async function previewCollection() {
  // Pass host and port as separate configuration properties
  const client = new ChromaClient({ 
    host: 'localhost',
    port: 8000 
  });
  
  try {
    const collection = await client.getCollection({ name: 'node-docs' });
    const count = await collection.count();
    const data = await collection.get({ limit: 10 });

    console.log(`┌─ Browsing Chroma Collection: node-docs ────────────────────────┐`);
    console.log(`│ Stored Records: ${count} elements found                                │`);
    console.log(`└────────────────────────────────────────────────────────────────┘\n`);

    const formattedGrid = data.ids.map((id, i) => ({
      'ID': id.substring(0, 20) + '...',
      'Document': data.documents[i]?.substring(0, 50).replace(/\n/g, ' ') + '...',
      'Metadata': JSON.stringify(data.metadatas[i])
    }));

    console.table(formattedGrid);
  } catch (err: any) {
    console.error('Connection failed:', err.message);
  }
}

previewCollection();