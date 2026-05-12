import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const server = new McpServer({
  name: "guitar-locator-harness",
  version: "1.0.0",
});

server.tool(
  "read_component",
  "Read a React component file",
  {
    name: z.string().describe("The name of the component file (e.g., 'Maps')"),
  },
  async ({ name }) => {
    const fileName = name.endsWith('.js') ? name : `${name}.js`;
    const filePath = path.join(__dirname, "..", "src", "components", fileName);
    
    try {
      const content = await fs.readFile(filePath, "utf-8");
      return {
        content: [{ type: "text", text: content }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  process.exit(1);
});