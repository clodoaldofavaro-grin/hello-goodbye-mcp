"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleBye = exports.byeToolDefinition = exports.ByeToolSchema = void 0;
const zod_1 = require("zod");
// 1. Tool Schema
exports.ByeToolSchema = zod_1.z.object({
    name: zod_1.z.string(),
});
// 2. Tool listing information
exports.byeToolDefinition = {
    name: "bye",
    description: "Returns a bye message",
    inputSchema: {
        type: "object",
        properties: {
            name: {
                type: "string",
                description: "The name to say bye to",
            },
        },
        required: ["name"],
    },
};
// 3. Tool implementation
const handleBye = (args) => {
    const validated = exports.ByeToolSchema.parse(args);
    const { name } = validated;
    return {
        content: [
            {
                type: "text",
                text: `Bye, ${name}! Don't let the door hit you on your way out!`,
            },
        ],
    };
};
exports.handleBye = handleBye;
