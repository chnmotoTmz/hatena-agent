// Placeholder type definitions for @mcp/sdk
// This allows TypeScript to compile without the actual package being installed.

declare module '@mcp/sdk' {
    export interface McpServerOptions {
        port: number;
        [key: string]: any; // Allow other options
    }

    export class McpServer {
        constructor(options: McpServerOptions);
        registerTool(tool: McpTool): void;
        start(): Promise<void>;
        getPort(): number;
    }

    export interface McpToolInput {
        [key: string]: any;
    }

    export interface McpToolOutput {
        status: 'success' | 'error' | 'pending';
        data?: any;
        message?: string;
        progress?: number;
    }

    export interface McpTool {
        name: string;
        description: string;
        inputSchema: object; // Simplified for placeholder
        outputSchema?: object; // Simplified for placeholder
        handler(inputs: McpToolInput): Promise<McpToolOutput>;
        // Add other potential tool properties if known
        // e.g., isLongRunning?: boolean;
        // e.g., categories?: string[];
    }
}
