// src/hatena_api/articleExtractor.ts
import { HatenaClient } from './hatenaClient';
import * as xml2js from 'xml2js';

export interface Article { // Ensure this is comprehensive
    id: string;
    hatenaInternalId: string;
    title: string;
    url?: string;
    editUrl?: string;
    content?: string;
    publishedDate: string;
    updatedDate: string;
    categories: string[];
    isDraft: boolean;
}

const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });

function parseHatenaEntryId(hatenaFullId: string): string {
    // ... (existing implementation)
    const parts = hatenaFullId.split('/');
    const lastPart = parts[parts.length - 1];
    if (lastPart && /^[0-9]+$/.test(lastPart)) return lastPart;
    const tagParts = hatenaFullId.split('-');
    const idPart = tagParts[tagParts.length -1];
    if (idPart && /^[0-9]+$/.test(idPart)) return idPart;
    return hatenaFullId;
}

export async function getArticleContent(client: HatenaClient, articleId: string): Promise<Article | null> {
    // ... (existing implementation, ensure it returns full Article structure) ...
    console.log(`[ArticleExtractor] Fetching full content for article ID: ${articleId}`);
    try {
        // When HatenaClient.get is called for a single entry, it should return an <entry> XML.
        const xmlString = await client.get(`/entry/${articleId}`);
        const result = await parser.parseStringPromise(xmlString);

        if (!result.entry) {
            // If the root is not <entry>, it might be that the client returned a <feed> by mistake for a single ID.
            // Or the ID was invalid and Hatena returned an error document (not handled here yet)
            console.error("[ArticleExtractor] No entry found in XML response for getArticleContent. XML Root:", result && Object.keys(result).length > 0 ? Object.keys(result)[0] : "empty or invalid XML", "Full result:", JSON.stringify(result).substring(0,200));
            return null;
        }
        const entry = result.entry;
        const categories = Array.isArray(entry.category) ? entry.category.map((c: any) => c.term) : (entry.category ? [entry.category.term] : []);
        const publicLink = Array.isArray(entry.link) ? entry.link.find((l: any) => l.rel === 'alternate' && l.type === 'text/html')?.href : entry.link?.href;

        return {
            id: articleId, // Use the passed-in numerical articleId
            hatenaInternalId: entry.id,
            title: entry.title && typeof entry.title === 'object' ? entry.title._ : entry.title,
            url: publicLink,
            editUrl: Array.isArray(entry.link) ? entry.link.find((l: any) => l.rel === 'edit')?.href : undefined,
            content: entry.content && typeof entry.content === 'object' ? entry.content._ : entry.content,
            publishedDate: entry.published,
            updatedDate: entry.updated,
            categories: categories,
            isDraft: entry['app:control']?.['app:draft'] === 'yes',
        };
    } catch (error: any) {
        console.error(`[ArticleExtractor] Error fetching/parsing article ${articleId}:`, error.message, error.stack);
        return null;
    }
}

export interface ArticleMetadataFilters {
    dateRangeStart?: string; // ISO 8601 date YYYY-MM-DD
    dateRangeEnd?: string;   // ISO 8601 date YYYY-MM-DD
    category?: string;
    status?: 'draft' | 'public';
    page?: string; // For pagination
}

export async function extractHatenaArticlesMetadata(
    client: HatenaClient,
    filters?: ArticleMetadataFilters
): Promise<{ articles: Partial<Article>[], nextPage?: string }> {
    const filterLog = filters ? JSON.stringify(filters) : "none";
    console.log(`[ArticleExtractor] Fetching article metadata. Filters: ${filterLog}`);

    const pageParam = filters?.page ? { page: filters.page } : {};
    try {
        // The mock client.get for '/entry' should return a <feed> XML.
        const xmlString = await client.get('/entry', pageParam);
        const result = await parser.parseStringPromise(xmlString);

        if (!result.feed || !result.feed.entry) {
            console.log("[ArticleExtractor] No entries found in feed or feed format unexpected.");
            return { articles: [], nextPage: undefined };
        }

        let entries = Array.isArray(result.feed.entry) ? result.feed.entry : [result.feed.entry];

        // --- SIMULATED FILTERING ---
        if (filters) {
            if (filters.category) {
                console.log(`[ArticleExtractor][Simulated Filter] Filtering by category: ${filters.category}`);
                entries = entries.filter((entry: any) => {
                    const categories = Array.isArray(entry.category) ? entry.category.map((c: any) => c.term) : (entry.category ? [entry.category.term] : []);
                    return categories.includes(filters.category);
                });
            }
            if (filters.status) {
                 console.log(`[ArticleExtractor][Simulated Filter] Filtering by status: ${filters.status}`);
                 entries = entries.filter((entry: any) => (entry['app:control']?.['app:draft'] === 'yes') === (filters.status === 'draft'));
            }
            if (filters.dateRangeStart) {
                console.log(`[ArticleExtractor][Simulated Filter] Filtering by dateRangeStart: ${filters.dateRangeStart}`);
                entries = entries.filter((entry: any) => new Date(entry.published) >= new Date(filters.dateRangeStart!));
            }
             if (filters.dateRangeEnd) {
                console.log(`[ArticleExtractor][Simulated Filter] Filtering by dateRangeEnd: ${filters.dateRangeEnd}`);
                entries = entries.filter((entry: any) => new Date(entry.published) <= new Date(filters.dateRangeEnd!));
            }
        }
        // --- END SIMULATED FILTERING ---

        const articles: Partial<Article>[] = entries.map((entry: any) => {
            const categories = Array.isArray(entry.category) ? entry.category.map((c: any) => c.term) : (entry.category ? [entry.category.term] : []);
            const publicLink = Array.isArray(entry.link) ? entry.link.find((l: any) => l.rel === 'alternate' && l.type === 'text/html')?.href : entry.link?.href;
            return {
                id: parseHatenaEntryId(entry.id), // This ID is for the Partial<Article> list
                hatenaInternalId: entry.id,
                title: entry.title && typeof entry.title === 'object' ? entry.title._ : entry.title,
                url: publicLink,
                publishedDate: entry.published,
                updatedDate: entry.updated,
                categories: categories,
                isDraft: entry['app:control']?.['app:draft'] === 'yes',
            };
        });

        let nextLinkHref: string | undefined = undefined;
        if (Array.isArray(result.feed.link)) {
            nextLinkHref = result.feed.link.find((l: any) => l.rel === 'next')?.href;
        } else if (result.feed.link && result.feed.link.rel === 'next') {
            nextLinkHref = result.feed.link.href;
        }

        console.log(`[ArticleExtractorDebug] Raw nextLinkHref from XML: '${nextLinkHref}'`);
        const nextPageVal = nextLinkHref ? new URL(nextLinkHref).searchParams.get('page') : undefined;

        return { articles, nextPage: nextPageVal || undefined };
    } catch (error: any) {
        console.error("[ArticleExtractor] Error fetching/parsing article metadata:", error.message, error.stack);
        return { articles: [], nextPage: undefined };
    }
}
