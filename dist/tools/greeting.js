"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGreeting = exports.greetingToolDefinition = exports.GreetingToolSchema = void 0;
const zod_1 = require("zod");
// 1. Tool Schema
exports.GreetingToolSchema = zod_1.z.object({
    name: zod_1.z.string(),
});
// 2. Tool listing information
exports.greetingToolDefinition = {
    name: "greeting",
    description: "Returns a greeting message",
    inputSchema: {
        type: "object",
        properties: {
            name: {
                type: "string",
                description: "The name to greet",
            },
        },
        required: ["name"],
    },
};
// 3. Tool implementation
const handleGreeting = (args) => {
    const validated = exports.GreetingToolSchema.parse(args);
    const { name } = validated;
    return {
        content: [
            {
                type: "text",
                text: `Hello, ${name}! Welcome to the Model Context Protocol. We are remote! Yay!`,
            },
        ],
    };
};
exports.handleGreeting = handleGreeting;
