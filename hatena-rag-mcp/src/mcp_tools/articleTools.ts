import { McpTool, McpToolInput, McpToolOutput } from '@mcp/sdk'; // Using placeholder SDK
import { HatenaClient } from '../hatena_api/hatenaClient';
import { getArticleContent, extractHatenaArticlesMetadata, Article, ArticleMetadataFilters } from '../hatena_api/articleExtractor';
import { retrieveSimilarArticleChunks, RetrievedChunkInfo } from '../rag/retrievalProcessor';
import { generateSummaryForArticleIds } from '../rag/summaryProcessor';
import { ArticleChunk } from '../data_storage/sqliteDb'; // For typing if needed

const getHatenaClient = () => {
    const username = process.env.HATENA_USERNAME;
    const apiKey = process.env.HATENA_API_KEY;
    const blogDomain = process.env.HATENA_BLOG_ID; // This is the blog_id part like "your-blog.hatenablog.com" or "subdomain" for "username.hatenablog.jp/subdomain"

    if (!username || !apiKey || !blogDomain) {
        // In a real scenario, might throw or have a more robust fallback/check
        console.warn("Hatena credentials (HATENA_USERNAME, HATENA_API_KEY, HATENA_BLOG_ID) not fully set. Tools may use dummy client.");
        return new HatenaClient("testuser", "testkey", "test.hatenablog.com"); // Dummy for compilation
    }
    return new HatenaClient(username, apiKey, blogDomain);
};

export const getArticleDetailsTool: McpTool = {
    name: "get_article_details",
    description: "Retrieves the full content and metadata of a specific Hatena Blog article by its numerical ID.",
    inputSchema: {
        type: 'object',
        properties: {
            article_id: { type: 'string', description: "The numerical ID of the article to retrieve." }
        },
        required: ['article_id']
    },
    async handler(inputs: McpToolInput): Promise<McpToolOutput> {
        const { article_id } = inputs as { article_id: string };
        try {
            const client = getHatenaClient();
            const article = await getArticleContent(client, article_id);
            if (article) {
                return { status: 'success', data: article };
            } else {
                return { status: 'error', message: `Article not found: ${article_id}` };
            }
        } catch (error: any) {
            console.error(`[ToolError:get_article_details] ${error.stack}`);
            return { status: 'error', message: error.message || "Failed to retrieve article details." };
        }
    }
};

interface SearchArticleResultItem {
    article_id?: string;
    article_title?: string;
    article_url?: string;
    published_date?: string;
    categories?: string[];
    snippet: string; // Could be from chunk or generated
    // score?: number; // If semantic search was performed
}

export const searchArticleContentTool: McpTool = {
    name: "search_article_content",
    description: "Searches article content using semantic query and/or filters by tags (categories) and date range.",
    inputSchema: {
        type: 'object',
        properties: {
            query: { type: 'string', description: "Natural language query for semantic search." },
            tags: { type: 'array', items: { type: 'string' }, description: "Array of tags (categories) to filter by." },
            date_range_start: { type: 'string', format: 'date', description: "Start date for filtering (YYYY-MM-DD)." },
            date_range_end: { type: 'string', format: 'date', description: "End date for filtering (YYYY-MM-DD)." },
            max_results: { type: 'integer', description: "Maximum number of results to return.", default: 5 }
        }
        // No single property is strictly required, but at least one of query/tags/date_range should be provided for meaningful search.
    },
    async handler(inputs: McpToolInput): Promise<McpToolOutput> {
        const { query, tags, date_range_start, date_range_end, max_results = 5 } = inputs as {
            query?: string;
            tags?: string[];
            date_range_start?: string;
            date_range_end?: string;
            max_results?: number;
        };

        let results: SearchArticleResultItem[] = [];

        try {
            if (query) {
                // Semantic search first
                console.log(`[SearchTool] Performing semantic search for query: "${query}"`);
                const semanticResults = await retrieveSimilarArticleChunks(query, max_results);

                let filteredSemanticResults = semanticResults;
                // Apply metadata filters ON TOP of semantic results
                if (tags && tags.length > 0) {
                    console.log(`[SearchTool] Filtering semantic results by tags: ${tags.join(', ')}`);
                    filteredSemanticResults = filteredSemanticResults.filter(item =>
                        item.article && item.article.categories.some(cat => tags.includes(cat))
                    );
                }
                if (date_range_start) {
                    console.log(`[SearchTool] Filtering semantic results by date_range_start: ${date_range_start}`);
                    filteredSemanticResults = filteredSemanticResults.filter(item =>
                        item.article && new Date(item.article.publishedDate) >= new Date(date_range_start)
                    );
                }
                if (date_range_end) {
                    console.log(`[SearchTool] Filtering semantic results by date_range_end: ${date_range_end}`);
                    filteredSemanticResults = filteredSemanticResults.filter(item =>
                        item.article && new Date(item.article.publishedDate) <= new Date(date_range_end)
                    );
                }

                results = filteredSemanticResults.map(item => ({
                    article_id: item.article?.id,
                    article_title: item.article?.title,
                    article_url: item.article?.url,
                    published_date: item.article?.publishedDate,
                    categories: item.article?.categories,
                    snippet: item.chunk.text.substring(0, 250) + "..."
                    // score: item.similarityScore // If available
                }));

            } else if ((tags && tags.length > 0) || date_range_start || date_range_end) {
                // Metadata filtering only
                console.log("[SearchTool] Performing metadata search.");
                const filters: ArticleMetadataFilters = {};
                if (tags && tags.length > 0) filters.category = tags[0]; // extractHatenaArticlesMetadata currently takes one category
                if (date_range_start) filters.dateRangeStart = date_range_start;
                if (date_range_end) filters.dateRangeEnd = date_range_end;

                const client = getHatenaClient();
                // This fetches only metadata. We might need full content for snippets.
                // For now, snippet will be generic for metadata-only search.
                const metadataResults = await extractHatenaArticlesMetadata(client, filters);

                results = metadataResults.articles.slice(0, max_results).map(articleMeta => ({
                    article_id: articleMeta.id,
                    article_title: articleMeta.title,
                    article_url: articleMeta.url,
                    published_date: articleMeta.publishedDate,
                    categories: articleMeta.categories,
                    snippet: `Metadata match for article: "${articleMeta.title}". Full content not fetched for snippet in this mode.`
                }));
            } else {
                return { status: 'success', data: [], message: "No query or filters provided for search." };
            }

            return { status: 'success', data: results.slice(0, max_results) };

        } catch (error: any) {
            console.error(`[ToolError:search_article_content] ${error.stack}`);
            return { status: 'error', message: error.message || "Failed to search article content." };
        }
    }
};

export const generateArticleSummaryTool: McpTool = {
    name: "generate_article_summary",
    description: "Generates a combined summary for a list of specified article IDs.",
    inputSchema: {
        type: 'object',
        properties: {
            article_ids: {
                type: 'array',
                items: { type: 'string' },
                description: "An array of article IDs to summarize."
            },
            summary_type: { type: 'string', description: "Optional type of summary (e.g., 'short', 'detailed'). Currently ignored by mock.", default: 'general' }
        },
        required: ['article_ids']
    },
    async handler(inputs: McpToolInput): Promise<McpToolOutput> {
        const { article_ids, summary_type } = inputs as { article_ids: string[]; summary_type?: string };

        if (!Array.isArray(article_ids) || article_ids.length === 0) {
            return { status: 'error', message: "Input 'article_ids' must be a non-empty array of strings." };
        }

        try {
            const summary = await generateSummaryForArticleIds(article_ids, summary_type);
            return { status: 'success', data: { summary_text: summary } };
        } catch (error: any) {
            console.error(`[ToolError:generate_article_summary] ${error.stack}`);
            return { status: 'error', message: error.message || "Failed to generate article summary." };
        }
    }
};

export const retrieveRelatedArticlesTool: McpTool = {
    name: "retrieve_related_articles",
    description: "Retrieves article chunks related to a given query using semantic search.",
    inputSchema: {
        type: 'object',
        properties: {
            query: { type: 'string', description: "The natural language query to search for." },
            max_results: { type: 'integer', description: "Maximum number of related articles/chunks to return.", default: 5 },
            similarity_threshold: { type: 'number', description: "Minimum similarity score for a chunk to be considered related (currently mock).", default: 0.1 } // Dot product can be > 1
        },
        required: ['query']
    },
    async handler(inputs: McpToolInput): Promise<McpToolOutput> {
        const { query, max_results, similarity_threshold } = inputs as { query: string; max_results?: number; similarity_threshold?: number };

        try {
            const results = await retrieveSimilarArticleChunks(
                query,
                max_results || 5,
                similarity_threshold
            );

            // Format the output
            const formattedResults = results.map(item => ({
                article_id: item.article?.id,
                article_title: item.article?.title,
                article_url: item.article?.url,
                chunk_id: item.chunk.chunkId,
                chunk_text_snippet: item.chunk.text.substring(0, 200) + "...", // Provide a snippet
                // Add embedding later if useful for client, or score
            }));

            return { status: 'success', data: formattedResults };
        } catch (error: any) {
            console.error(`[ToolError:retrieve_related_articles] ${error.stack}`);
            return { status: 'error', message: error.message || "Failed to retrieve related articles." };
        }
    }
};

export const extractHatenaArticlesTool: McpTool = {
    name: "extract_hatena_articles", // Renamed
    description: "Extracts a list of Hatena Blog article metadata based on optional filters.",
    inputSchema: {
        type: 'object',
        properties: {
            date_range_start: { type: 'string', format: 'date', description: "Start date for filtering (YYYY-MM-DD)." },
            date_range_end: { type: 'string', format: 'date', description: "End date for filtering (YYYY-MM-DD)." },
            category: { type: 'string', description: "Category to filter by." },
            status: { type: 'string', enum: ['draft', 'public'], description: "Filter by article status." },
            page: { type: 'string', description: "Pagination token from previous response's 'nextPage'." }
        },
        // No required properties, all are optional filters
    },
    async handler(inputs: McpToolInput): Promise<McpToolOutput> {
        const { date_range_start, date_range_end, category, status, page } = inputs as any;

        const filters: ArticleMetadataFilters = {};
        if (date_range_start) filters.dateRangeStart = date_range_start;
        if (date_range_end) filters.dateRangeEnd = date_range_end;
        if (category) filters.category = category;
        if (status) filters.status = status;
        if (page) filters.page = page;

        try {
            const client = getHatenaClient(); // Assumes client is configured with blog_id
            const result = await extractHatenaArticlesMetadata(client, filters);
            return { status: 'success', data: result }; // result includes { articles: [], nextPage?: string }
        } catch (error: any) {
            console.error(`[ToolError:extract_hatena_articles] ${error.stack}`);
            return { status: 'error', message: error.message || "Failed to extract articles." };
        }
    }
};
