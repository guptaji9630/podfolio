# Functional Podfolio canvas service

Run `npm install`, `npm run build`, then `npm start`, or `npm run dev`. HTTP listens on port 3001 by default. `.env` supports PORT, FRONTEND_URL and ALLOWED_ORIGINS. The frontend editor is at http://localhost:5173/mcp and the service root redirects there.

The supported entrypoint is `src/service.ts`, independent of the older unfinished scaffold. `POST /mcp` implements stateless Streamable HTTP and requires a UUID `x-canvas-id` header. Implemented tools: create_element, create_from_mermaid, query_elements, export_scene and export_to_image (SVG). Canvas scene GET/PUT and SVG endpoints are scoped to that UUID. The backend supplies the same conversation UUID for tool execution and editing. Scene IDs are access capabilities. No general filesystem, email or shell tools are exposed.

The service keeps at most 1000 scenes and 500 elements per scene, with a 24-hour expiry and 200KB scene payload cap. PUT requires expectedRevision and rejects concurrent stale writes with 409. Scenes are not durable across restarts. SVG export supports standard shapes, text, arrows and freehand paths; complex editor styling may differ.

Run `npm run typecheck`, `npm run build` and `npm test`. Tests use real local MCP transport and verify scene mutation, isolation, optimistic concurrency, diagram parsing, export escaping and bounds.
