import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GreetingToolSchema, handleGreeting, greetingToolDefinition } from "./tools/greeting";
import { ByeToolSchema, byeToolDefinition, handleBye } from "./tools/bye";

export function createMcpServer() {
    const server = new McpServer({
        name: "example-server",
        version: "1.0.0"
    });

    // Register tools using the simpler McpServer API
    server.tool(
        greetingToolDefinition.name,
        greetingToolDefinition.description,
        GreetingToolSchema.shape,
        handleGreeting
    );

    server.tool(
        byeToolDefinition.name,
        byeToolDefinition.description,
        ByeToolSchema.shape,
        handleBye
    );

    return server;
} 