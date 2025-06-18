// src/rag/retrievalProcessor.ts
import { ArticleChunk, getArticleById } from '../data_storage/sqliteDb'; // getArticleById for context
import { generateEmbedding } from './embeddingProcessor';
import { vectorStore } from './vectorStore';
import { Article } from '../hatena_api/articleExtractor'; // For return type

export interface RetrievedChunkInfo {
    chunk: ArticleChunk;
    article?: Article; // Include parent article info
    similarityScore?: number; // If available from vector store directly, or re-calculate
}

export async function retrieveSimilarArticleChunks(
    queryText: string,
    maxResults: number,
    similarityThreshold?: number
): Promise<RetrievedChunkInfo[]> {
    if (!queryText) return [];

    console.log(`[RetrievalProcessor] Processing query: "${queryText.substring(0, 50)}..."`);
    const queryEmbedding = await generateEmbedding(queryText);

    // The current vectorStore.search doesn't return scores, but we could modify it or re-score here
    // For now, we'll just get the chunks.
    const similarChunks = await vectorStore.search(queryEmbedding, maxResults, similarityThreshold);
    console.log(`[RetrievalProcessor] Found ${similarChunks.length} raw chunks from vector store.`);

    const results: RetrievedChunkInfo[] = [];
    for (const chunk of similarChunks) {
        const article = await getArticleById(chunk.articleId); // Fetch parent article details
        results.push({
            chunk: chunk,
            article: article // article will be undefined if not found, handle in tool
        });
    }
    return results;
}
