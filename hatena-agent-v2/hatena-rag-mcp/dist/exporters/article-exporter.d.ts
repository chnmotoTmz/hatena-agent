import { ArticleDatabase, SearchOptions } from '../database/article-db.js';
export interface ExportOptions {
    filterConditions?: SearchOptions;
    fields?: string[];
    includeContent?: boolean;
}
export declare class ArticleExporter {
    private database;
    constructor(database: ArticleDatabase);
    exportToCSV(outputPath: string, filterConditions?: SearchOptions, fields?: string[]): Promise<void>;
    exportToJSON(outputPath: string, filterConditions?: SearchOptions): Promise<void>;
    exportKnowledgeBase(outputPath: string, format?: 'text' | 'json' | 'markdown', chunkingStrategy?: 'sentence' | 'paragraph' | 'semantic'): Promise<void>;
    private generateCSV;
    private escapeCSVField;
    private generateKnowledgeBaseJSON;
    private generateKnowledgeBaseMarkdown;
    private generateKnowledgeBaseText;
    private chunkContent;
    private chunkBySentence;
    private chunkByParagraph;
    private chunkSemantically;
    private ensureDirectoryExists;
    exportStatistics(outputPath: string): Promise<void>;
    private calculateStatistics;
}
