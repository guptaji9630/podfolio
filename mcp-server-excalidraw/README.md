# Excalidraw MCP Server

Standalone MCP server for Excalidraw, deployable as a separate service on Render.

## Quick Start

### Local Development
```bash
cd mcp-server-excalidraw
npm install
npm run build
npm run dev
```

### Run with STDIO (for MCP clients)
```bash
npm run build
node dist/index.js --stdio
```

### Run as HTTP/WebSocket Server (for Render)
```bash
npm run build
EXPRESS_SERVER_URL=http://localhost:3001 PORT=3001 node dist/index.js
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EXPRESS_SERVER_URL` | Yes | `http://localhost:3001` | Public URL of the canvas server |
| `PORT` | No | `3001` | Port for HTTP/WebSocket server |
| `MCP_ADMIN_TOKEN` | No | - | Admin token for MCP admin endpoints |

## Deploy to Render

### 1. Create Web Service
- **Build Command**: `npm install && npm run build`
- **Start Command**: `node dist/index.js`
- **Environment Variables**:
  - `EXPRESS_SERVER_URL`: `https://your-service.onrender.com`
  - `PORT`: `3001`
  - `MCP_ADMIN_TOKEN`: (generate a secure token)

### 2. Configure WebSocket Support
- Enable **WebSocket** support in Render service settings
- The canvas WebSocket runs on `/ws` path

### 3. Health Checks
- HTTP: `GET /health`
- MCP: `GET /mcp/health`

## Communication with Main Backend

### Main Backend Config (pod-mac-vite/pod-backend/.env)
```env
MCP_CONNECTIONS='[{"id":"excalidraw","name":"Excalidraw","transport":"stdio","command":"npx","args":["-y","mcp-excalidraw-server"],"enabled":true,"env":{"EXPRESS_SERVER_URL":"https://your-excalidraw-service.onrender.com"}}]'
```

Or for HTTP transport:
```env
MCP_CONNECTIONS='[{"id":"excalidraw","name":"Excalidraw","transport":"http","url":"https://your-excalidraw-service.onrender.com/mcp","enabled":true}]'
```

### Communication Flow
1. Main backend starts → Auto-connects to Excalidraw MCP server
2. Main backend discovers 26 Excalidraw tools
3. User asks "draw a flowchart" → Agent routes to `create_from_mermaid` tool
3. MCP client calls Excalidraw server via HTTP/STDIO
4. Excalidraw server renders on canvas at `EXPRESS_SERVER_URL`
4. Response includes `canvasUrl` for user to view

## Canvas Server (WebSocket)
- **URL**: `wss://your-excalidraw-service.onrender.com/ws`
- Handles real-time canvas sync
- Multiple clients can connect simultaneously

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/mcp/health` | MCP health check |
| GET | `/mcp/sse` | MCP SSE endpoint |
| POST | `/mcp` | MCP HTTP endpoint |
| WS | `/ws` | Canvas WebSocket |

## Tools Available (26)

| Tool | Description |
|------|-------------|
| `create_element` | Create new element |
| `update_element` | Update existing element |
| `delete_element` | Delete element |
| `query_elements` | Query with filters |
| `get_element` | Get single element |
| `get_resource` | Get scene/library/theme |
| `group_elements` | Group elements |
| `ungroup_elements` | Ungroup elements |
| `align_elements` | Align elements |
| `distribute_elements` | Distribute evenly |
| `lock_elements` | Lock elements |
| `unlock_elements` | Unlock elements |
| `create_from_mermaid` | Convert Mermaid to Excalidraw |
| `batch_create_elements` | Create multiple elements |
| `get_element` | Get single element |
| `clear_canvas` | Clear all elements |
| `export_scene` | Export to .excalidraw JSON |
| `import_scene` | Import from .excalidraw |
| `export_to_image` | Export PNG/SVG |
| `duplicate_elements` | Duplicate elements |
| `snapshot_scene` | Save snapshot |
| `restore_snapshot` | Restore snapshot |
| `describe_scene` | AI-readable description |
| `get_canvas_screenshot` | Screenshot |
| `read_diagram_guide` | Design guide |
| `export_to_excalidraw_url` | Shareable URL |
| `set_viewport` | Control viewport |

## Communication with Main Backend

### Main Backend Configuration
```env
# .env
MCP_CONNECTIONS='[{"id":"excalidraw","name":"Excalidraw","transport":"http","url":"https://your-excalidraw-service.onrender.com/mcp","enabled":true}]'
```

The main backend will:
1. Auto-connect on startup
2. Discover 26 Excalidraw tools
3. Route MCP tool calls via HTTP to Excalidraw service
4. Return `canvasUrl` in responses for user to view

## Troubleshooting

### Canvas Not Accessible
- Check `EXPRESS_SERVER_URL` is publicly accessible
- Verify WebSocket support enabled on Render
- Check `/health` and `/mcp/health` endpoints

### MCP Connection Failed
- Verify `MCP_ADMIN_TOKEN` matches between services
- Check `/mcp/health` returns 200
- Check logs for connection errors

### WebSocket Issues
- Ensure Render WebSocket support enabled
- Check `/ws` path accessible
- Verify CORS headers

## Development

```bash
# Install
npm install

# Build
npm run build

# Dev with hot reload
npm run dev

# Test
npm test
```

## License
MIT