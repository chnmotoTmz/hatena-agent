import { Article } from '../extractors/article-extractor.js';
export interface SearchOptions {
    query?: string;
    tags?: string[];
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
}
export declare class ArticleDatabase {
    private db;
    private dbPath;
    constructor(dbPath?: string);
    initialize(): Promise<void>;
    private createTables;
    saveArticles(articles: Article[]): Promise<void>;
    searchArticles(options: SearchOptions): Promise<Article[]>;
    getArticleById(articleId: string): Promise<Article | null>;
    getAllArticles(): Promise<Article[]>;
    private rowToArticle;
    close(): Promise<void>;
}
