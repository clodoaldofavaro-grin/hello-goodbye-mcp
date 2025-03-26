import express, { Request, Response } from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import cors from 'cors';
import { createMcpServer } from "./mcp-server";

const app = express();
const mcpServer = createMcpServer();

// Add CORS middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// to support multiple simultaneous connections we have a lookup object from
// sessionId to transport
const transports: {[sessionId: string]: SSEServerTransport} = {};

app.get("/", async (_: Request, res: Response) => {
  try {
    const transport = new SSEServerTransport('/messages', res);
    transports[transport.sessionId] = transport;
    res.on("close", () => {
      delete transports[transport.sessionId];
    });
    await mcpServer.connect(transport);
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