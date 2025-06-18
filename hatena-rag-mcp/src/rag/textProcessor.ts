// src/rag/textProcessor.ts
import { ArticleChunk } from '../data_storage/sqliteDb';

// Simple sentence tokenizer (can be improved)
function getSentences(text: string): string[] {
    if (!text) return [];
    // Basic split by common sentence-ending punctuation.
    // This doesn't handle all cases (e.g., "Mr. Smith") but is a start.
    const sentences = text.replace(/([.?!])\s*(?=[A-Z])/g, "$1|").split("|");
    return sentences.map(s => s.trim()).filter(s => s.length > 0);
}

export interface ChunkingOptions {
    strategy: 'sentence' | 'fixedSize';
    maxChunkSize?: number; // For sentence strategy: max sentences per chunk. For fixedSize: max chars.
    overlapSentences?: number; // For sentence strategy: number of sentences to overlap
}

export function chunkArticleContent(
    articleId: string,
    content: string,
    options: ChunkingOptions = { strategy: 'sentence', maxChunkSize: 3, overlapSentences: 1 }
): ArticleChunk[] {
    if (!content) return [];

    const chunks: ArticleChunk[] = [];
    let chunkIndex = 0;

    if (options.strategy === 'sentence') {
        const sentences = getSentences(content);
        const maxSentences = options.maxChunkSize || 3;
        const overlap = options.overlapSentences || 1;

        for (let i = 0; i < sentences.length; i += maxSentences - overlap) {
            const sentenceSlice = sentences.slice(i, i + maxSentences);
            if (sentenceSlice.length === 0) continue;

            const chunkText = sentenceSlice.join(' ');
            chunks.push({
                chunkId: `${articleId}_${chunkIndex}`,
                articleId: articleId,
                text: chunkText,
            });
            chunkIndex++;
            if (i + maxSentences >= sentences.length) break; // Ensure we don't go into an infinite loop if overlap is too large
        }
    } else if (options.strategy === 'fixedSize') {
        const chunkSize = options.maxChunkSize || 500; // Default 500 chars
        // Simple fixed-size chunking without overlap for now
        for (let i = 0; i < content.length; i += chunkSize) {
            const chunkText = content.substring(i, i + chunkSize);
            chunks.push({
                chunkId: `${articleId}_${chunkIndex}`,
                articleId: articleId,
                text: chunkText,
            });
            chunkIndex++;
        }
    }

    console.log(`[TextProcessor] Chunked article ${articleId} into ${chunks.length} chunks using ${options.strategy} strategy.`);
    return chunks;
}
