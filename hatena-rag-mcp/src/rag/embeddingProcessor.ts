// src/rag/embeddingProcessor.ts

export const EMBEDDING_DIMENSION = 128; // Example dimension

/**
 * Simulates generating an embedding for a given text.
 * In a real scenario, this would call an actual embedding model/service.
 * @param text The text content of an article chunk.
 * @returns A promise that resolves to a number array representing the embedding.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay

    // Generate a mock embedding (e.g., random vector)
    const mockEmbedding: number[] = [];
    for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
        mockEmbedding.push(parseFloat(Math.random().toFixed(4)));
    }

    // console.log(`[EmbeddingProcessor] Generated mock embedding for text: "${text.substring(0, 30)}..."`);
    return mockEmbedding;
}

export async function generateMockSummary(text: string, type?: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 20)); // Simulate longer processing for summary
    const prefix = type ? `[${type}] Summary` : "Summary";
    if (!text || text.trim().length === 0) {
        return `${prefix}: The provided text was empty or contained only whitespace.`;
    }
    // Return a summary that's clearly a mock
    return `${prefix} of text starting with: "${text.substring(0, 100)}..." (Total length: ${text.length} chars). This is a mock summary.`;
}
