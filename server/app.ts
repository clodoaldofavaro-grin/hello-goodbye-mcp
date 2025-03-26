import express, { Request, Response } from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import cors from 'cors';
import { createMcpServer } from "./mcp-server";

export function createApp() {
    const app = express();
    const mcpServer = createMcpServer();

    // Add CORS middleware
    app.use(cors({
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type']
    }));

    // Map to track transports by session ID
    const transports: {[sessionId: string]: SSEServerTransport} = {};

    app.get("/", async (_: Request, res: Response) => {
        try {
            // Each client gets their own transport with a unique session ID
            const transport = new SSEServerTransport('/messages', res);
            transports[transport.sessionId] = transport;
            
            res.on("close", () => {
                // Clean up the transport when the client disconnects
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
            // Each message includes the session ID of the client that sent it
            const sessionId = req.query.sessionId as string;
            const transport = transports[sessionId];
            
            if (transport) {
                // Only handle messages through the transport that belongs to the sending client
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

    return app;
} 