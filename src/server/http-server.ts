import startServer from "./server.js";

// Environment variables with default values
const PORT = parseInt(process.env.PORT || "3000", 10);

// 检查环境变量

// GITLAB 相关
let gitlab_is_enabled = process.env.GITLAB_IS_ENABLED === 'true' ? true : false;
if (gitlab_is_enabled) {
  if (!process.env.GITLAB_URL) {
    console.error("GITLAB_URL environment variable is required");
    process.exit(1);
  }

  if (!process.env.GITLAB_TOKEN) {
    console.error("GITLAB_TOKEN environment variable is required");
    process.exit(1);
  }
}

async function main() {
  try {
    // Create and initialize the FastMCP server
    const server = await startServer();
    
    // Start the server with HTTP transport
    server.start({
      transportType: "httpStream",
      httpStream: {
      port: PORT,
    }});
    
    console.error(`MCP Server running at http://localhost:${PORT}`);
    // console.error(`SSE endpoint: http://localhost:${PORT}/sse`);
    console.error(`HTTP Stream endpoint: http://localhost:${PORT}/mcp`);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on("SIGINT", () => {
  console.error("Shutting down server...");
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
}); 