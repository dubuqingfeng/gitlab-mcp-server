import { FastMCP } from "fastmcp";
import { registerResources } from "../core/resources.js";
import { registerPrompts } from "../core/prompts.js";
import { registerGitlabTools } from "../core/tools/gitlab.js";
import { loggers } from "../core/utils/logger.js";

const serverLogger = loggers.server;

// Create and start the MCP server
async function startServer() {
  try {
    // Create a new FastMCP server instance
    const server = new FastMCP({
      name: "MCP Server",
      version: "1.0.0",
    });

    // Register all resources, tools, and prompts
    registerResources(server);
    registerGitlabTools(server);
    registerPrompts(server);
    
    // Log server information
    serverLogger.info("MCP Server initialized");
    serverLogger.info("Server is ready to handle requests");
    
    return server;
  } catch (error) {
    serverLogger.error({ err: error }, "Failed to initialize server");
    process.exit(1);
  }
}

// Export the server creation function
export default startServer; 