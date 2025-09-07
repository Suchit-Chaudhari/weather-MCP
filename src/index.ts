import express, { request, response } from "express";
import axios from "axios";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const API_KEY = "e8792e5503e74bfbb8a71435251108";

// Function to create a new MCP server instance
function getServer() {
  const server = new McpServer({
    name: "Weather MCP Server",
    version: "1.0.0",
  });

  // Define the weather tool
  server.tool(
    "getWeather",
    { city: z.string() },
    async ({ city }) => {
      const res = await axios.get("http://api.weatherapi.com/v1/current.json", {
        params: { key: API_KEY, q: city, aqi: "no" },
      });
      const data = res.data;

      return {
        content: [{
          type: "text",
          text: `Weather in ${data.location.name}, ${data.location.country}: ${data.current.temp_c}°C, ${data.current.condition.text}`,
        }],
      };
    }
  );

  return server;
}

const app = express();
app.use(express.json());

// POST endpoint for MCP requests
app.post("/mcp", async (req: express.Request, res: express.Response) => {
  try {
    // New server + transport per request to avoid ID collisions
    const server = getServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on("close", () => {
      console.log("Request closed");
      transport.close();
      server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);

  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
});

// GET not allowed in stateless mode
app.get("/mcp", (req: express.Request, res: express.Response) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed" },
    id: null,
  });
});

// DELETE not allowed in stateless mode
app.delete("/mcp", (req: express.Request, res: express.Response) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed" },
    id: null,
  });
});

// Start the HTTP server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`MCP Stateless HTTP Server running on http://localhost:${PORT}/mcp`);
});
