"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const sse_js_1 = require("@modelcontextprotocol/sdk/server/sse.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const cors_1 = __importDefault(require("cors"));
const greeting_1 = require("./tools/greeting");
const bye_1 = require("./tools/bye");
const server = new index_js_1.Server({
    name: "example-server",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {}
    }
});
// ... set up server resources, tools, and prompts ...
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools: [greeting_1.greetingToolDefinition, bye_1.byeToolDefinition]
    };
});
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    switch (name) {
        case 'greeting':
            return (0, greeting_1.handleGreeting)(args);
        case 'bye':
            return (0, bye_1.handleBye)(args);
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
});
const app = (0, express_1.default)();
// Add CORS middleware
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
// to support multiple simultaneous connections we have a lookup object from
// sessionId to transport
const transports = {};
app.get("/", async (_, res) => {
    try {
        const transport = new sse_js_1.SSEServerTransport('/messages', res);
        transports[transport.sessionId] = transport;
        res.on("close", () => {
            delete transports[transport.sessionId];
        });
        await server.connect(transport);
        console.log(`SSE connection established with session ID: ${transport.sessionId}`);
    }
    catch (error) {
        console.error('Error establishing SSE connection:', error);
        res.status(500).send('Error establishing SSE connection');
    }
});
app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId;
    const transport = transports[sessionId];
    if (transport) {
        await transport.handlePostMessage(req, res);
    }
    else {
        res.status(400).send('No transport found for sessionId');
    }
});
const port = parseInt(process.env.PORT || '3000', 10);
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
});
