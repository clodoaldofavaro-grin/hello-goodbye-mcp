import express, { Request, Response } from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import cors from 'cors';

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

// Add CORS middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// to support multiple simultaneous connections we have a lookup object from
// sessionId to transport
const transports: {[sessionId: string]: SSEServerTransport} = {};
app.get("/sse", async (_: Request, res: Response) => {
  try {
    const transport = new SSEServerTransport('/messages', res);
    transports[transport.sessionId] = transport;
    res.on("close", () => {
      delete transports[transport.sessionId];
    });
    await server.connect(transport);
    console.log(`SSE connection established with session ID: ${transport.sessionId}`);
  } catch (error) {
    console.error('Error establishing SSE connection:', error);
    res.status(500).send('Error establishing SSE connection');
  }
});

app.post("/messages", async (req: Request, res: Response) => {
  try {
    const sessionId = req.query.sessionId as string;
    console.log(`Received message for session ID: ${sessionId}`);
    const transport = transports[sessionId];
    if (transport) {
      await transport.handlePostMessage(req, res);
    } else {
      console.error(`No transport found for sessionId: ${sessionId}`);
      res.status(400).send('No transport found for sessionId');
    }
  } catch (error) {
    console.error('Error handling message:', error);
    res.status(500).send('Error handling message');
  }
});

const port = parseInt(process.env.PORT || '3000', 10);

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});