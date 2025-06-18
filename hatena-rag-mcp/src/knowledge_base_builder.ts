// src/knowledge_base_builder.ts
import { HatenaClient } from './hatena_api/hatenaClient';
import { extractHatenaArticlesMetadata, getArticleContent, Article } from './hatena_api/articleExtractor';
import {
    initDatabase, saveArticleMetadata, getAllArticles, clearInMemoryStore,
    saveArticleChunk, getAllChunks, ArticleChunk
} from './data_storage/sqliteDb';
import { chunkArticleContent } from './rag/textProcessor';
import { generateEmbedding } from './rag/embeddingProcessor';
import { vectorStore } from './rag/vectorStore'; // Import vector store

// Function to get Hatena client (copied from articleTools.ts for now, should be centralized later)
const getHatenaClient = () => {
    const username = process.env.HATENA_USERNAME || "testuser";
    const apiKey = process.env.HATENA_API_KEY || "testapikey";
    const blogDomain = process.env.HATENA_BLOG_ID || "testblog.hatenablog.com";
    return new HatenaClient(username, apiKey, blogDomain);
};

export async function buildKnowledgeBase(): Promise<void> {
    console.log("Starting knowledge base construction (with vector store)...");
    await initDatabase();      // Initializes in-memory article/chunk stores
    await clearInMemoryStore();  // Clears in-memory article/chunk stores
    await vectorStore.clear(); // Clear vector store explicitly

    // ... (client setup, pagination logic as before) ...
    const client = getHatenaClient();
    let currentPage: string | undefined = undefined;
    let pageCount = 0;
    const maxPagesToFetch = 1;
    let articlesProcessedCount = 0;
    // Keep a temporary list of all chunks from all articles processed in this run
    const allProcessedChunksThisRun: ArticleChunk[] = [];

    do {
        pageCount++;
        console.log(`Fetching metadata page: ${pageCount} (token: ${currentPage || 'initial'})`);
        const { articles: metadataList, nextPage } = await extractHatenaArticlesMetadata(client, currentPage);

        if (!metadataList || metadataList.length === 0) {
            console.log("No articles found on this page. Stopping.");
            break;
        }
        console.log(`Found ${metadataList.length} articles on page ${pageCount}.`);

        for (const meta of metadataList) {
            if (!meta.id) {
                console.warn("Article metadata missing ID, skipping:", meta.title);
                continue;
            }
            const fullArticle = await getArticleContent(client, meta.id);

            if (fullArticle && fullArticle.content) {
                await saveArticleMetadata(fullArticle);
                articlesProcessedCount++;

                const articleChunksRaw = chunkArticleContent(fullArticle.id, fullArticle.content, {
                    strategy: 'sentence', maxChunkSize: 3, overlapSentences: 1
                });

                for (const rawChunk of articleChunksRaw) {
                    const embedding = await generateEmbedding(rawChunk.text);
                    const chunkWithEmbedding: ArticleChunk = { ...rawChunk, embedding: embedding };
                    // Save to primary chunk store (optional if vector store is the main target for chunks with embeddings)
                    await saveArticleChunk(chunkWithEmbedding);
                    allProcessedChunksThisRun.push(chunkWithEmbedding); // Collect for bulk add to vector store
                }
                console.log(`Article ${fullArticle.id} processed into ${articleChunksRaw.length} chunks with embeddings.`);
            } else {
                console.warn(`Could not retrieve full content for article ID: ${meta.id}, or content was empty.`);
            }
        }
        currentPage = nextPage;
        if (pageCount >= maxPagesToFetch && maxPagesToFetch > 0) break;
    } while (currentPage);

    // Add all collected chunks to the vector store
    if (allProcessedChunksThisRun.length > 0) {
        console.log(`Adding ${allProcessedChunksThisRun.length} processed chunks to the vector store...`);
        await vectorStore.addChunks(allProcessedChunksThisRun);
    }

    const totalArticlesInDb = (await getAllArticles()).length;
    const totalChunksInDb = (await getAllChunks()).length; // Chunks in sqliteDb.ts store
    const totalChunksInVectorStore = await vectorStore.getChunkCount();

    console.log(`Knowledge base construction finished. Total articles: ${totalArticlesInDb}, Total chunks (sqliteDb): ${totalChunksInDb}, Total chunks (vectorStore): ${totalChunksInVectorStore}`);

    // Test search
    if (totalChunksInVectorStore > 0) {
        const firstChunkForTest = allProcessedChunksThisRun[0];
        if (firstChunkForTest && firstChunkForTest.embedding) {
            console.log(`
--- Testing Vector Search ---`);
            console.log(`Searching with embedding of chunk: "${firstChunkForTest.text.substring(0,50)}..."`);
            const searchResults = await vectorStore.search(firstChunkForTest.embedding, 3);
            console.log(`Found ${searchResults.length} similar chunks:`);
            searchResults.forEach(result => {
                console.log(`  ID: ${result.chunkId}, Score: (approx), Text: "${result.text.substring(0, 50)}..."`);
            });
            console.log(`--- End Vector Search Test ---
`);
        }
    }
}

// ... (if require.main === module block remains the same) ...
if (require.main === module) {
    buildKnowledgeBase().catch(error => {
        console.error("Error building knowledge base:", error);
    });
}
