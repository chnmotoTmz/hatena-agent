// src/data_storage/sqliteDb.ts
import { Article } from '../hatena_api/articleExtractor';

// --- Existing Article Store ---
let articlesStore: Article[] = [];
let articlesMap: Map<string, Article> = new Map();

export async function initDatabase(): Promise<void> {
    articlesStore = [];
    articlesMap.clear();
    chunksStore = []; // Clear chunks too
    chunksMap.clear();
    console.log("In-memory article and chunk store initialized.");
    return Promise.resolve();
}

// --- Functions from previous step, ensure they are present ---
export async function saveArticleMetadata(article: Article): Promise<void> {
    if (!articlesMap.has(article.id)) {
        articlesStore.push(article);
    }
    articlesMap.set(article.id, article);
    console.log(`[InMemoryStore] Saved/Updated metadata for article: ${article.id} - ${article.title}`);
    return Promise.resolve();
}

export async function getArticleById(id: string): Promise<Article | undefined> {
    return Promise.resolve(articlesMap.get(id));
}

export async function getAllArticles(): Promise<Article[]> {
    return Promise.resolve([...articlesStore]); // Return a copy
}
// --- End of existing functions ---

export async function clearInMemoryStore(): Promise<void> {
    articlesStore = [];
    articlesMap.clear();
    chunksStore = [];
    chunksMap.clear();
    console.log("In-memory article and chunk store cleared.");
    return Promise.resolve();
}


// --- New Chunk Store ---
export interface ArticleChunk {
    chunkId: string; // e.g., articleId_chunkIndex
    articleId: string;
    text: string;
    embedding?: number[]; // Added field for embedding
}

let chunksStore: ArticleChunk[] = [];
// For quick lookups if needed, though maybe less critical than for articles
let chunksMap: Map<string, ArticleChunk> = new Map();

export async function saveArticleChunk(chunk: ArticleChunk): Promise<void> {
    if (!chunksMap.has(chunk.chunkId)) {
        chunksStore.push(chunk);
    }
    chunksMap.set(chunk.chunkId, chunk);
    // console.log(`[InMemoryStore] Saved chunk: ${chunk.chunkId} for article ${chunk.articleId}`);
    return Promise.resolve();
}

export async function getChunksByArticleId(articleId: string): Promise<ArticleChunk[]> {
    const articleChunks = chunksStore.filter(chunk => chunk.articleId === articleId);
    return Promise.resolve(articleChunks);
}

export async function getAllChunks(): Promise<ArticleChunk[]> {
    return Promise.resolve([...chunksStore]);
}
