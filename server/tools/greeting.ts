import { z } from "zod";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";

// 1. Tool Schema
export const GreetingToolSchema = z.object({
  name: z.string(),
});

// 2. Tool listing information
export const greetingToolDefinition = {
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
export const handleGreeting = async (args: unknown, _extra: RequestHandlerExtra) => {
  const validated = GreetingToolSchema.parse(args);
  const { name } = validated;

  return {
    content: [
      {
        type: "text" as const,
        text: `Hello, ${name}! Welcome to the Model Context Protocol. We are remote! Yay!`,
      },
    ],
  };
};
