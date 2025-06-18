export interface Article {
    id: string;
    title: string;
    url: string;
    date: string;
    categories: string[];
    summary: string;
    content?: string;
    images: Array<{
        url: string;
        alt: string;
        title: string;
    }>;
    links: Array<{
        url: string;
        text: string;
        isExternal: boolean;
    }>;
    wordCount: number;
}
export declare class HatenaArticleExtractor {
    private hatenaId;
    private blogDomain;
    private baseUrl;
    private axiosInstance;
    configure(hatenaId: string, blogDomain?: string): void;
    extractAllArticles(maxPages?: number, extractFullContent?: boolean): Promise<Article[]>;
    private extractPageArticles;
    private parseArticleElement;
    extractArticleContent(articleUrl: string): Promise<{
        content: string;
        images: Array<{
            url: string;
            alt: string;
            title: string;
        }>;
        links: Array<{
            url: string;
            text: string;
            isExternal: boolean;
        }>;
        wordCount: number;
    }>;
    private generateArticleId;
    private resolveUrl;
    private isExternalUrl;
    private delay;
}
