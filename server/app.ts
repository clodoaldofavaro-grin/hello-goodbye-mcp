import express, { Request, Response, NextFunction } from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import cors from 'cors';
import { createMcpServer } from "./mcp-server";

// Authentication middleware
function authenticateRequest(req: Request, res: Response, next: NextFunction): void {
    const token = req.params.token;
    
    // Validate against environment variable
    if (!token || token !== process.env.MCP_TOKEN) {
        res.status(401).json({ error: 'Unauthorized - Invalid Token' });
        return;
    }
    
    next();
}

export function createApp() {
    const app = express();
    const mcpServer = createMcpServer();

    // Add CORS middleware
    app.use(cors({
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type']
    }));

    // Map to track authenticated transports by session ID
    const transports: {[sessionId: string]: SSEServerTransport} = {};

    // Add authentication to the SSE endpoint
    app.get("/:token/sse", authenticateRequest, async (req: Request, res: Response): Promise<void> => {
        try {
            // Each authenticated client gets their own transport with a unique session ID
            const transport = new SSEServerTransport(`/${req.params.token}/messages`, res);
            transports[transport.sessionId] = transport;
            
            // Store authentication info with the transport if needed
            // @ts-ignore - adding custom property
            transport.token = req.params.token;
            
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

    // Add authentication to the messages endpoint
    app.post("/:token/messages", authenticateRequest, async (req: Request, res: Response): Promise<void> => {
        try {
            const sessionId = req.query.sessionId as string;
            const transport = transports[sessionId];

            // Add logging for incoming messages
            console.log('Received message:', {
                sessionId,
                body: req.body,
                availableTransports: Object.keys(transports)
            });
            
            if (!transport) {
                console.error(`No transport found for sessionId: ${sessionId}`);
                res.status(400).send('No transport found for sessionId');
                return;
            }

            // Verify that the token matches the one used to establish the transport
            // @ts-ignore - accessing custom property
            if (transport.token !== req.params.token) {
                res.status(401).send('Token does not match the one used to establish connection');
                return;
            }
            
            await transport.handlePostMessage(req, res);
        } catch (error) {
            console.error('Error handling message:', error);
            res.status(500).send('Error handling message');
        }
    });

    return app;
} 