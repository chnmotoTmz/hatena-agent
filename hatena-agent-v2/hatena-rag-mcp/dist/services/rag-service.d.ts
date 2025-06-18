import { ArticleDatabase } from '../database/article-db.js';
import { Article } from '../extractors/article-extractor.js';
export interface RelatedArticle {
    article: Article;
    score: number;
    reason: string;
}
export declare class HatenaRAGService {
    private openai;
    private database;
    constructor(database: ArticleDatabase);
    findRelatedArticles(query: string, similarityThreshold?: number, maxResults?: number): Promise<RelatedArticle[]>;
    private findSemanticallySimilarArticles;
    private findKeywordBasedRelatedArticles;
    private getEmbedding;
    private cosineSimilarity;
    private getArticleText;
    private extractKeywords;
    private calculateKeywordScore;
    private getMatchingKeywords;
    generateSummary(articleIds: string[], summaryType: 'brief' | 'detailed' | 'outline'): Promise<string>;
    private generateAISummary;
    private generateSimpleSummary;
    private getDateRange;
}
