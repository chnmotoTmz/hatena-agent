// src/rag/summaryProcessor.ts
import { getArticleById } from '../data_storage/sqliteDb';
import { generateMockSummary } from './embeddingProcessor'; // Using the mock summarizer

export async function generateSummaryForArticleContents(
    articleContents: string[],
    summaryType?: string
): Promise<string> {
    if (!articleContents || articleContents.length === 0) {
        return "No article content provided to summarize.";
    }

    const combinedText = articleContents.join("\n\n--- Next Article ---\n\n");
    console.log(`[SummaryProcessor] Generating summary for combined text of length: ${combinedText.length}`);

    const summary = await generateMockSummary(combinedText, summaryType);
    return summary;
}

export async function generateSummaryForArticleIds(
    articleIds: string[],
    summaryType?: string
): Promise<string> {
    if (!articleIds || articleIds.length === 0) {
        return "No article IDs provided for summarization.";
    }
    console.log(`[SummaryProcessor] Preparing to summarize articles: ${articleIds.join(', ')}`);

    const contentsToSummarize: string[] = [];
    for (const id of articleIds) {
        const article = await getArticleById(id);
        if (article && article.content) {
            contentsToSummarize.push(article.content);
        } else {
            console.warn(`[SummaryProcessor] Article ${id} not found or has no content.`);
        }
    }

    if (contentsToSummarize.length === 0) {
        return "None of the specified articles could be found or had content.";
    }

    return generateSummaryForArticleContents(contentsToSummarize, summaryType);
}
