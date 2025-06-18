import * as fs from 'fs/promises';
import * as path from 'path';
export class ArticleExporter {
    database;
    constructor(database) {
        this.database = database;
    }
    async exportToCSV(outputPath, filterConditions, fields) {
        const articles = filterConditions ?
            await this.database.searchArticles(filterConditions) :
            await this.database.getAllArticles();
        if (articles.length === 0) {
            throw new Error('No articles found to export');
        }
        const csvContent = this.generateCSV(articles, fields);
        await this.ensureDirectoryExists(outputPath);
        await fs.writeFile(outputPath, csvContent, 'utf-8');
    }
    async exportToJSON(outputPath, filterConditions) {
        const articles = filterConditions ?
            await this.database.searchArticles(filterConditions) :
            await this.database.getAllArticles();
        const jsonContent = JSON.stringify(articles, null, 2);
        await this.ensureDirectoryExists(outputPath);
        await fs.writeFile(outputPath, jsonContent, 'utf-8');
    }
    async exportKnowledgeBase(outputPath, format = 'json', chunkingStrategy = 'paragraph') {
        const articles = await this.database.getAllArticles();
        if (articles.length === 0) {
            throw new Error('No articles found to export');
        }
        let content;
        switch (format) {
            case 'json':
                content = await this.generateKnowledgeBaseJSON(articles, chunkingStrategy);
                break;
            case 'markdown':
                content = await this.generateKnowledgeBaseMarkdown(articles);
                break;
            case 'text':
                content = await this.generateKnowledgeBaseText(articles);
                break;
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
        await this.ensureDirectoryExists(outputPath);
        await fs.writeFile(outputPath, content, 'utf-8');
    }
    generateCSV(articles, fields) {
        const defaultFields = ['id', 'title', 'url', 'date', 'categories', 'summary', 'wordCount'];
        const selectedFields = fields || defaultFields;
        // CSV header
        const header = selectedFields.join(',');
        // CSV rows
        const rows = articles.map(article => {
            return selectedFields.map(field => {
                let value;
                switch (field) {
                    case 'id':
                        value = article.id;
                        break;
                    case 'title':
                        value = article.title;
                        break;
                    case 'url':
                        value = article.url;
                        break;
                    case 'date':
                        value = article.date;
                        break;
                    case 'categories':
                        value = article.categories.join(';');
                        break;
                    case 'summary':
                        value = article.summary;
                        break;
                    case 'content':
                        value = article.content || '';
                        break;
                    case 'wordCount':
                        value = article.wordCount;
                        break;
                    case 'imageCount':
                        value = article.images.length;
                        break;
                    case 'linkCount':
                        value = article.links.length;
                        break;
                    default:
                        value = '';
                }
                // Escape CSV value
                return this.escapeCSVField(String(value));
            }).join(',');
        });
        return [header, ...rows].join('\n');
    }
    escapeCSVField(field) {
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
            return '"' + field.replace(/"/g, '""') + '"';
        }
        return field;
    }
    async generateKnowledgeBaseJSON(articles, chunkingStrategy) {
        const knowledgeBase = {
            metadata: {
                exportDate: new Date().toISOString(),
                totalArticles: articles.length,
                chunkingStrategy,
                source: 'hatena-blog'
            },
            documents: []
        };
        for (const article of articles) {
            const chunks = this.chunkContent(article.content || article.summary, chunkingStrategy);
            for (let i = 0; i < chunks.length; i++) {
                knowledgeBase.documents.push({
                    id: `${article.id}_chunk_${i}`,
                    articleId: article.id,
                    title: article.title,
                    url: article.url,
                    date: article.date,
                    categories: article.categories,
                    content: chunks[i],
                    metadata: {
                        chunkIndex: i,
                        totalChunks: chunks.length,
                        wordCount: chunks[i].split(/\s+/).length,
                        originalWordCount: article.wordCount
                    }
                });
            }
        }
        return JSON.stringify(knowledgeBase, null, 2);
    }
    async generateKnowledgeBaseMarkdown(articles) {
        let markdown = '# Hatena Blog Knowledge Base\n\n';
        markdown += `Generated on: ${new Date().toISOString()}\n`;
        markdown += `Total Articles: ${articles.length}\n\n`;
        markdown += '---\n\n';
        for (const article of articles) {
            markdown += `## ${article.title}\n\n`;
            markdown += `- **URL**: ${article.url}\n`;
            markdown += `- **Date**: ${article.date}\n`;
            markdown += `- **Categories**: ${article.categories.join(', ')}\n`;
            markdown += `- **Word Count**: ${article.wordCount}\n\n`;
            if (article.summary) {
                markdown += `### Summary\n\n${article.summary}\n\n`;
            }
            if (article.content) {
                markdown += `### Content\n\n${article.content}\n\n`;
            }
            markdown += '---\n\n';
        }
        return markdown;
    }
    async generateKnowledgeBaseText(articles) {
        let text = `Hatena Blog Knowledge Base\n`;
        text += `Generated: ${new Date().toISOString()}\n`;
        text += `Articles: ${articles.length}\n`;
        text += `${'='.repeat(50)}\n\n`;
        for (const article of articles) {
            text += `TITLE: ${article.title}\n`;
            text += `URL: ${article.url}\n`;
            text += `DATE: ${article.date}\n`;
            text += `CATEGORIES: ${article.categories.join(', ')}\n`;
            text += `WORDS: ${article.wordCount}\n`;
            text += `${'-'.repeat(30)}\n`;
            text += `${article.content || article.summary}\n`;
            text += `${'='.repeat(50)}\n\n`;
        }
        return text;
    }
    chunkContent(content, strategy) {
        if (!content || content.trim().length === 0) {
            return [''];
        }
        switch (strategy) {
            case 'sentence':
                return this.chunkBySentence(content);
            case 'paragraph':
                return this.chunkByParagraph(content);
            case 'semantic':
                return this.chunkSemantically(content);
            default:
                return [content];
        }
    }
    chunkBySentence(content) {
        // Split by sentence boundaries (simplified)
        const sentences = content.split(/[。！？．!?]+/).filter(s => s.trim().length > 0);
        const chunks = [];
        let currentChunk = '';
        for (const sentence of sentences) {
            if (currentChunk.length + sentence.length > 1000) {
                if (currentChunk) {
                    chunks.push(currentChunk.trim());
                    currentChunk = '';
                }
            }
            currentChunk += sentence + '。';
        }
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }
        return chunks.length > 0 ? chunks : [content];
    }
    chunkByParagraph(content) {
        const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        const chunks = [];
        let currentChunk = '';
        for (const paragraph of paragraphs) {
            if (currentChunk.length + paragraph.length > 1500) {
                if (currentChunk) {
                    chunks.push(currentChunk.trim());
                    currentChunk = '';
                }
            }
            currentChunk += paragraph + '\n\n';
        }
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }
        return chunks.length > 0 ? chunks : [content];
    }
    chunkSemantically(content) {
        // Simple semantic chunking - can be enhanced with NLP
        const sections = content.split(/(?=#+\s)|(?=■)|(?=◆)|(?=\d+\.)/);
        return sections.filter(section => section.trim().length > 0);
    }
    async ensureDirectoryExists(filePath) {
        const dir = path.dirname(filePath);
        try {
            await fs.access(dir);
        }
        catch {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    async exportStatistics(outputPath) {
        const articles = await this.database.getAllArticles();
        if (articles.length === 0) {
            throw new Error('No articles found for statistics');
        }
        const stats = this.calculateStatistics(articles);
        const statsContent = JSON.stringify(stats, null, 2);
        await this.ensureDirectoryExists(outputPath);
        await fs.writeFile(outputPath, statsContent, 'utf-8');
    }
    calculateStatistics(articles) {
        const totalArticles = articles.length;
        const totalWords = articles.reduce((sum, article) => sum + article.wordCount, 0);
        const averageWords = totalWords / totalArticles;
        const categories = articles.flatMap(article => article.categories);
        const categoryCount = categories.reduce((acc, cat) => {
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {});
        const dates = articles.map(article => article.date).filter(date => date);
        const dateRange = dates.length > 0 ? {
            earliest: dates.sort()[0],
            latest: dates.sort().reverse()[0]
        } : null;
        const totalImages = articles.reduce((sum, article) => sum + article.images.length, 0);
        const totalLinks = articles.reduce((sum, article) => sum + article.links.length, 0);
        return {
            overview: {
                totalArticles,
                totalWords,
                averageWords: Math.round(averageWords),
                totalImages,
                totalLinks,
                dateRange
            },
            categories: {
                total: Object.keys(categoryCount).length,
                distribution: Object.entries(categoryCount)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
            },
            wordCountDistribution: {
                short: articles.filter(a => a.wordCount < 500).length,
                medium: articles.filter(a => a.wordCount >= 500 && a.wordCount < 1500).length,
                long: articles.filter(a => a.wordCount >= 1500).length
            }
        };
    }
}
