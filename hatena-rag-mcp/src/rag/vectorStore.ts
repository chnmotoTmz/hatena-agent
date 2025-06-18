// src/rag/vectorStore.ts
import { ArticleChunk } from '../data_storage/sqliteDb';

// Simple dot product similarity (assumes non-normalized vectors for simplicity with random data)
// For normalized vectors, this would be cosine similarity.
function dotProduct(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
        // console.warn("[VectorStore] Invalid vectors for dot product.", vecA, vecB);
        return 0;
    }
    let product = 0;
    for (let i = 0; i < vecA.length; i++) {
        product += vecA[i] * vecB[i];
    }
    return product;
}

export interface VectorStore {
    addChunks(chunks: ArticleChunk[]): Promise<void>;
    search(queryEmbedding: number[], maxResults: number, similarityThreshold?: number): Promise<ArticleChunk[]>;
    clear(): Promise<void>; // Added for easier testing
    getChunkCount(): Promise<number>; // Added for easier testing
}

class InMemoryVectorStore implements VectorStore {
    private chunks: ArticleChunk[] = [];

    async addChunks(newChunks: ArticleChunk[]): Promise<void> {
        for (const chunk of newChunks) {
            if (chunk.embedding) { // Only add chunks that have an embedding
                // In a real store, might check for duplicates or update existing
                this.chunks.push(chunk);
            } else {
                console.warn(`[VectorStore] Chunk ${chunk.chunkId} has no embedding, not adding to vector store.`);
            }
        }
        // console.log(`[VectorStore] Added ${newChunks.filter(c => c.embedding).length} chunks. Total in store: ${this.chunks.length}`);
    }

    async search(queryEmbedding: number[], maxResults: number, similarityThreshold?: number): Promise<ArticleChunk[]> {
        if (!queryEmbedding || queryEmbedding.length === 0) {
            return [];
        }

        const scoredChunks = this.chunks
            .map(chunk => {
                if (!chunk.embedding) return { chunk, score: -Infinity }; // Should not happen if addChunks filters
                const score = dotProduct(queryEmbedding, chunk.embedding);
                return { chunk, score };
            })
            .filter(item => item.score > (similarityThreshold || -Infinity)); // Apply threshold

        // Sort by score descending
        scoredChunks.sort((a, b) => b.score - a.score);

        return scoredChunks.slice(0, maxResults).map(item => item.chunk);
    }

    async clear(): Promise<void> {
        this.chunks = [];
        console.log("[VectorStore] In-memory vector store cleared.");
    }

    async getChunkCount(): Promise<number> {
        return this.chunks.length;
    }
}

// Singleton instance of the in-memory vector store
export const vectorStore: VectorStore = new InMemoryVectorStore();
