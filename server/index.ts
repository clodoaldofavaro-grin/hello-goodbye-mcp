import express, { Request, Response } from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import { greetingToolDefinition, handleGreeting } from "./tools/greeting";
import { byeToolDefinition, handleBye } from "./tools/bye";

const server = new Server(
    {
        name: "example-server",
        version: "1.0.0", 
    },
    {
        capabilities: {
            tools: {}
        }
    }
);

// ... set up server resources, tools, and prompts ...
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [greetingToolDefinition, byeToolDefinition]
    }
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
        case 'greeting':
            return handleGreeting(args);
        case 'bye':
            return handleBye(args);    
        default:
            throw new Error(`Unknown tool: ${name}`);    
    }
})

const app = express();

// to support multiple simultaneous connections we have a lookup object from
// sessionId to transport
const transports: {[sessionId: string]: SSEServerTransport} = {};

app.get("/sse", async (_: Request, res: Response) => {
  const transport = new SSEServerTransport('/messages', res);
  transports[transport.sessionId] = transport;
  res.on("close", () => {
    delete transports[transport.sessionId];
  });
  await server.connect(transport);
});

app.post("/messages", async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send('No transport found for sessionId');
  }
});

app.listen(3001);