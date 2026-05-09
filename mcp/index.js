// initialize mcp server for agent harness  

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const server = new McpServer({
  name: "guitar-locator-harness",
  version: "1.0.0",
});

// allow ai to read react components 
server.tool("read_component", { name: "string" }, async ({ name }) => {
  // Maps.js 
  const filePath = path.join(__dirname, "..", "src", "components", `${name}.js`);
  
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return {
      content: [{ type: "text", text: content }]
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Could not find component: ${name}. Checked path: ${filePath}` }],
      isError: true
    };
  }
});

// connect with stdio 
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Guitar Locator Harness is live via stdio.");
}

main().catch((error) => {
  console.error("Fatal Server Error:", error);
  process.exit(1);
});