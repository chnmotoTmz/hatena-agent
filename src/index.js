#!/usr/bin/env node

/**
 * Hatena Blog MCP Server
 * Provides multi-blog management capabilities for Hatena Blog
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { spawn } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize the MCP server
const server = new Server(
  {
    name: "hatena-agent",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Python script paths
const PYTHON_SCRIPTS = {
  multi_blog_manager: resolve(__dirname, "../multi_blog_manager.py"),
  enhanced_hatena_agent: resolve(__dirname, "../enhanced_hatena_agent.py"),
  simple_test: resolve(__dirname, "../simple_test.py"),
};

// Helper function to execute Python scripts
async function executePythonScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const python = spawn("python", [scriptPath, ...args], {
      cwd: dirname(scriptPath),
    });

    let stdout = "";
    let stderr = "";

    python.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    python.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    python.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject(new Error(`Python script failed with code ${code}: ${stderr}`));
      }
    });
  });
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "test_blog_connections",
        description: "Test connections to all configured Hatena blogs",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "search_articles",
        description: "Search for articles in a specific blog",
        inputSchema: {
          type: "object",
          properties: {
            blog_id: {
              type: "string",
              description: "Blog ID (lifehack_blog, mountain_blog, tech_blog)",
            },
            query: {
              type: "string",
              description: "Search query for article titles",
            },
          },
          required: ["blog_id", "query"],
        },
      },
      {
        name: "migrate_article",
        description: "Migrate an article from one blog to another",
        inputSchema: {
          type: "object",
          properties: {
            source_blog: {
              type: "string",
              description: "Source blog ID",
            },
            target_blog: {
              type: "string",
              description: "Target blog ID",
            },
            article_id: {
              type: "string",
              description: "Article ID to migrate",
            },
            copy_mode: {
              type: "boolean",
              description: "If true, copy article (keep original). If false, move article.",
              default: true,
            },
          },
          required: ["source_blog", "target_blog", "article_id"],
        },
      },
      {
        name: "list_articles",
        description: "List articles from a specific blog",
        inputSchema: {
          type: "object",
          properties: {
            blog_id: {
              type: "string",
              description: "Blog ID (lifehack_blog, mountain_blog, tech_blog)",
            },
            limit: {
              type: "number",
              description: "Maximum number of articles to return",
              default: 10,
            },
          },
          required: ["blog_id"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "test_blog_connections": {
        const result = await executePythonScript(PYTHON_SCRIPTS.simple_test);
        return {
          content: [
            {
              type: "text",
              text: `Blog Connection Test Results:\n\n${result.stdout}${result.stderr ? `\nErrors: ${result.stderr}` : ""}`,
            },
          ],
        };
      }

      case "search_articles": {
        const { blog_id, query } = args;
        const pythonCode = `
from enhanced_hatena_agent import EnhancedHatenaAgent
import json

agent = EnhancedHatenaAgent()
results = agent.search_articles_by_title('${blog_id}', '${query}')
print(json.dumps(results, ensure_ascii=False, indent=2))
`;
        
        const result = await executePythonScript("python", ["-c", pythonCode]);
        return {
          content: [
            {
              type: "text",
              text: `Search Results for "${query}" in ${blog_id}:\n\n${result.stdout}`,
            },
          ],
        };
      }

      case "migrate_article": {
        const { source_blog, target_blog, article_id, copy_mode = true } = args;
        const pythonCode = `
from enhanced_hatena_agent import EnhancedHatenaAgent
import json

agent = EnhancedHatenaAgent()
result = agent.migrate_article('${source_blog}', '${target_blog}', '${article_id}', copy_mode=${copy_mode ? 'True' : 'False'})
print(json.dumps(result, ensure_ascii=False, indent=2))
`;
        
        const result = await executePythonScript("python", ["-c", pythonCode]);
        return {
          content: [
            {
              type: "text",
              text: `Article Migration Result:\n\n${result.stdout}`,
            },
          ],
        };
      }

      case "list_articles": {
        const { blog_id, limit = 10 } = args;
        const pythonCode = `
from enhanced_hatena_agent import EnhancedHatenaAgent
import json

agent = EnhancedHatenaAgent()
articles = agent.get_recent_articles('${blog_id}', ${limit})
print(json.dumps(articles, ensure_ascii=False, indent=2))
`;
        
        const result = await executePythonScript("python", ["-c", pythonCode]);
        return {
          content: [
            {
              type: "text",
              text: `Recent Articles from ${blog_id}:\n\n${result.stdout}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error executing ${name}: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Hatena Blog MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
