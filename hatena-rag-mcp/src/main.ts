// src/main.ts
import { McpServer } from '@mcp/sdk';
import {
    getArticleDetailsTool,
    extractHatenaArticlesTool,
    retrieveRelatedArticlesTool,
    generateArticleSummaryTool,
    searchArticleContentTool // Added new tool
} from './mcp_tools/articleTools';
import { buildKnowledgeBase } from './knowledge_base_builder';
// ... (other imports for testing)
import { getAllArticles } from './data_storage/sqliteDb'; // To get some article IDs for testing


async function startServerOrTest() {
    if (process.env.RUN_KB_BUILDER_TEST === 'true') {
        console.log("Running Full Test Suite (including search_article_content)...");
        try {
            // ... (env var setup) ...
            process.env.HATENA_USERNAME = process.env.HATENA_USERNAME || "testuser_kb";
            process.env.HATENA_API_KEY = process.env.HATENA_API_KEY || "testapikey_kb";
            process.env.HATENA_BLOG_ID = process.env.HATENA_BLOG_ID || "testblog_kb.hatenablog.com";

            await buildKnowledgeBase();
            console.log("\nKnowledge Base Builder finished.\n");

            // Retrieval Test (can be kept or commented if too verbose)
            console.log("\n--- Testing retrieveSimilarArticleChunks ---");
            const { retrieveSimilarArticleChunks: retrieveChunks } = await import('./rag/retrievalProcessor');
            const testQueryRetrieval = "second sentence";
            const retrievedToolData = await retrieveChunks(testQueryRetrieval, 2); // limit to 2 for brevity
            console.log(`Retrieved ${retrievedToolData.length} items for query "${testQueryRetrieval}":`);
            retrievedToolData.forEach(item => {
                console.log(`  Article: ${item.article?.title}, Chunk: "${item.chunk.text.substring(0,30)}..."`);
            });
            console.log("--- End retrieveSimilarArticleChunks Test ---\n");

            // Summary Test (can be kept or commented if too verbose)
            console.log("\n--- Testing generateSummaryForArticleIds ---");
            const { generateSummaryForArticleIds: genSummary } = await import('./rag/summaryProcessor');
            const allArticlesForSummary = await getAllArticles();
            if (allArticlesForSummary.length > 0) {
                const idsToSummarize = allArticlesForSummary.slice(0, 2).map(a => a.id);
                if (idsToSummarize.length > 0) {
                    console.log(`Attempting to summarize article IDs: ${idsToSummarize.join(', ')}`);
                    const summaryResult = await genSummary(idsToSummarize, "test_type");
                    console.log("Summary Result:", summaryResult);
                } else {
                    console.log("Not enough articles in store to test summary.");
                }
            } else {
                console.log("No articles in store to test summary.");
            }
            console.log("--- End generateSummaryForArticleIds Test ---\n");

            // Test for extractHatenaArticlesTool (can be kept or commented)
            console.log("\n--- Testing extractHatenaArticlesTool ---");
            const extractorTestInput1 = { category: "tech" };
            console.log("Calling extractHatenaArticlesTool with filters:", extractorTestInput1);
            const extractorResult1 = await extractHatenaArticlesTool.handler(extractorTestInput1);
            console.log("Result 1 (category 'tech'):", JSON.stringify(extractorResult1.data, null, 2));
            const extractorTestInput2 = { status: "draft" };
            console.log("Calling extractHatenaArticlesTool with filters:", extractorTestInput2);
            const extractorResult2 = await extractHatenaArticlesTool.handler(extractorTestInput2);
            console.log("Result 2 (status 'draft'):", JSON.stringify(extractorResult2.data, null, 2));
            console.log("--- End extractHatenaArticlesTool Test ---\n");

            // Test for searchArticleContentTool
            console.log("\n--- Testing searchArticleContentTool ---");
            // const { searchArticleContentTool: searchTool } = await import('./mcp_tools/articleTools'); // No need to re-import

            // Test 1: Query only
            let searchInput: McpToolInput = { query: "python content" };
            console.log("Calling searchArticleContentTool with input:", searchInput);
            let searchResult = await searchArticleContentTool.handler(searchInput);
            console.log("Search Result (query only):", JSON.stringify(searchResult.data, null, 2));

            // Test 2: Tag (category) only
            searchInput = { tags: ["lifestyle"] };
            console.log("Calling searchArticleContentTool with input:", searchInput);
            searchResult = await searchArticleContentTool.handler(searchInput);
            console.log("Search Result (tag only):", JSON.stringify(searchResult.data, null, 2));

            // Test 3: Query AND Tag
            searchInput = { query: "Python", tags: ["tech"] };
            console.log("Calling searchArticleContentTool with input:", searchInput);
            searchResult = await searchArticleContentTool.handler(searchInput);
            console.log("Search Result (query AND tag 'tech'):", JSON.stringify(searchResult.data, null, 2));

            // Test 4: Query AND Tag (no match for tag)
            searchInput = { query: "Python", tags: ["lifestyle"] };
            console.log("Calling searchArticleContentTool with input:", searchInput);
            searchResult = await searchArticleContentTool.handler(searchInput);
            console.log("Search Result (query AND tag 'lifestyle'):", JSON.stringify(searchResult.data, null, 2));

            console.log("--- End searchArticleContentTool Test ---\n");

        } catch (error) {
            console.error("Full Test Suite failed:", error);
            process.exit(1);
        }
    } else {
        // ... (Simulated MCP Server start logic) ...
        console.log("Attempting to start MCP Server (simulated)...");
        const port = parseInt(process.env.PORT || '3000');
        console.log(`MCP Server placeholder: Would run on port ${port}`);
        console.log("MCP Server lines are commented out due to missing @mcp/sdk package.");
        console.log("Registered tools (simulated): get_article_details, extract_hatena_articles, retrieve_related_articles, generate_article_summary, search_article_content");
    }
}

startServerOrTest().catch(error => {
    console.error("Operation failed:", error);
    process.exit(1);
});
