import { z } from "zod";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";

// 1. Tool Schema
export const ByeToolSchema = z.object({
  name: z.string(),
});

// 2. Tool listing information
export const byeToolDefinition = {
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
export const handleBye = async (args: unknown, extra: RequestHandlerExtra) => {
  const validated = ByeToolSchema.parse(args);
  const { name } = validated;

  return {
    content: [
      {
        type: "text" as const,
        text: `Bye, ${name}! Don't let the door hit you on your way out!`,
      },
    ],
  };
};
