import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from 'http';
import { parse } from 'url';
import { WebSocketServer } from 'ws';
import express from 'express';
import cors from 'cors';
import { CanvasServer } from './canvas-server.js';
import { registerTools } from './tools/index.js';

const EXPRESS_SERVER_URL = process.env.EXPRESS_SERVER_URL || 'http://localhost:3001';
const PORT = parseInt(process.env.PORT || '3001', 10);
const STDIO_MODE = process.argv.includes('--stdio') || process.argv.includes('start');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Canvas server instance
const canvasServer = new CanvasServer();

// MCP Server instance
const mcpServer = new McpServer({
  name: 'excalidraw',
  version: '2.1.2',
});

// Register all tools
registerTools(mcpServer, canvasServer);

// Health check for MCP
app.get('/mcp/health', (_req, res) => {
  res.json({ status: 'ok', mcp: 'connected' });
});

// SSE endpoint for MCP (for HTTP transport)
app.get('/mcp/sse', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  await mcpServer.connect(transport);
  
  req.on('close', () => {
    transport.close();
    mcpServer.close();
  });
});

// POST endpoint for MCP (for HTTP transport)
app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });

  await mcpServer.connect(transport);
  await transport.handleRequest(req, res);
});

// Start canvas WebSocket server
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

canvasServer.attachWebSocketServer(wss);

// Handle graceful shutdown
const shutdown = async () => {
  console.log('Shutting down...');
  await canvasServer.shutdown();
  await mcpServer.close();
  server.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
if (STDIO_MODE) {
  // STDIO mode for MCP client connections
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error('MCP Server running in STDIO mode');
} else {
  // HTTP + WebSocket mode for Render deployment
  server.listen(PORT, () => {
    console.log(`Excalidraw MCP Server running on ${EXPRESS_SERVER_URL}`);
    console.log(`Canvas WebSocket: ws://localhost:${PORT}/ws`);
    console.log(`MCP SSE: ${EXPRESS_SERVER_URL}/mcp/sse`);
    console.log(`MCP HTTP: ${EXPRESS_SERVER_URL}/mcp`);
    console.log(`Health: ${EXPRESS_SERVER_URL}/health`);
  });
}

export { app, server, canvasServer, mcpServer };