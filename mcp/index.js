// An Agent Harness that reads this entire project

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..");

const server = new McpServer({
  name: "guitar-locator-harness",
  version: "1.0.0",
});

// list files in any directory 
server.tool(
  "list_files",
  "List files in a directory to explore the project structure",
  {
    relative_path: z.string().describe("The path relative to project root (e.g., 'src' or 'src/components')").default(""),
  },
  async ({ relative_path }) => {
    try {
      const targetPath = path.join(PROJECT_ROOT, relative_path);
      const entries = await fs.readdir(targetPath, { withFileTypes: true });
      
      const list = entries.map(entry => {
        return entry.isDirectory() ? `[DIR] ${entry.name}` : entry.name;
      }).join("\n");

      return {
        content: [{ type: "text", text: list || "(empty directory)" }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }
);

// read any file in project
server.tool(
  "read_file",
  "Read the contents of any file in the project",
  {
    relative_path: z.string().describe("The path to the file relative to project root (e.g., 'package.json' or 'src/App.js')"),
  },
  async ({ relative_path }) => {
    try {
      const filePath = path.join(PROJECT_ROOT, relative_path);
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