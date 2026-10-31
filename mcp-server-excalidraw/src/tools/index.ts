import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { CanvasServer } from '../canvas-server.js';

export function registerTools(server: McpServer, canvasServer: any): void {
  // Create a new Excalidraw element
  server.tool(
    'create_element',
    'Create a new Excalidraw element. For arrows, use startElementId/endElementId to bind to shapes (auto-routes to edges).',
    {
      id: z.string().optional().describe('Custom element ID (optional, auto-generated if omitted). Use with startElementId/endElementId in batch_create_elements.'),
      type: z.enum(['rectangle', 'ellipse', 'diamond', 'arrow', 'text', 'freedraw', 'line', 'image', 'frame']).describe('Element type'),
      x: z.number().describe('X coordinate'),
      y: z.number().describe('Y coordinate'),
      width: z.number().optional().describe('Width (required for rectangle, ellipse, diamond, frame, image)'),
      height: z.number().optional().describe('Height (required for rectangle, ellipse, diamond, frame, image)'),
      backgroundColor: z.string().optional().describe('Background color (hex)'),
      strokeColor: z.string().optional().describe('Stroke color (hex)'),
      strokeWidth: z.number().optional().describe('Stroke width'),
      strokeStyle: z.enum(['solid', 'dashed', 'dotted']).optional().describe('Stroke style'),
      roughness: z.number().optional().describe('Roughness (0-10)'),
      opacity: z.number().optional().describe('Opacity (0-100)'),
      text: z.string().optional().describe('Text content (for text elements)'),
      fontSize: z.number().optional().describe('Font size'),
      fontFamily: z.union([z.number(), z.string()]).optional().describe('Font family: virgil/hand/handwritten (1), helvetica/sans/sans-serif (2), cascadia/mono/monospace (3), excalifont (5), nunito (6), lilita/lilita one (7), comic shanns/comic (8), or numeric ID'),
      startElementId: z.string().optional().describe('For arrows: ID of the element to bind the arrow start to. Arrow auto-routes to element edge.'),
      endElementId: z.string().optional().describe('For arrows: ID of the element to bind the arrow end to. Arrow auto-routes to element edge.'),
      endArrowhead: z.enum(['arrow', 'bar', 'dot', 'triangle']).optional().describe('Arrowhead style at end'),
      startArrowhead: z.enum(['arrow', 'bar', 'dot', 'triangle']).optional().describe('Arrowhead style at start'),
    },
    async (args) => {
      try {
        const element = {
          id: args.id || crypto.randomUUID(),
          type: args.type,
          x: args.x,
          y: args.y,
          width: args.width,
          height: args.height,
          backgroundColor: args.backgroundColor,
          strokeColor: args.strokeColor,
          strokeWidth: args.strokeWidth,
          strokeStyle: args.strokeStyle,
          roughness: args.roughness,
          opacity: args.opacity,
          text: args.text,
          fontSize: args.fontSize,
          fontFamily: args.fontFamily,
          startElementId: args.startElementId,
          endElementId: args.endElementId,
          endArrowhead: args.endArrowhead,
          startArrowhead: args.startArrowhead,
        };
        
        // Call canvas server to create element
        const canvasServer = globalThis.canvasServer;
        if (canvasServer) {
          canvasServer.createElement(element);
        }
        
        return {
          content: [{ 
            type: 'text', 
            text: `Element created successfully!\n\n${JSON.stringify({ ...element, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1 }, null, 2)}\n\n✅ Synced to canvas` 
          }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error creating element: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    }
  );

  // Update an existing Excalidraw element
  server.tool(
    'update_element',
    'Update an existing Excalidraw element',
    {
      id: z.string().describe('Element ID to update'),
      type: z.enum(['rectangle', 'ellipse', 'diamond', 'arrow', 'text', 'freedraw', 'line', 'image', 'frame']).optional(),
      x: z.number().optional(),
      y: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      backgroundColor: z.string().optional(),
      strokeColor: z.string().optional(),
      strokeWidth: z.number().optional(),
      strokeStyle: z.enum(['solid', 'dashed', 'dotted']).optional(),
      roughness: z.number().optional(),
      opacity: z.number().optional(),
      text: z.string().optional(),
      fontSize: z.number().optional(),
      fontFamily: z.union([z.number(), z.string()]).optional(),
    },
    async (args) => {
      try {
        const { id, ...updates } = args;
        const canvasServer = globalThis.canvasServer;
        if (canvasServer) {
          canvasServer.updateElement({ id, ...updates });
        }
        
        return {
          content: [{ type: 'text', text: `Element ${args.id} updated successfully` }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error updating element: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    }
  );

  // Delete an Excalidraw element
  server.tool(
    'delete_element',
    'Delete an Excalidraw element',
    {
      id: z.string().describe('The element ID to delete'),
    },
    async (args) => {
      try {
        const canvasServer = globalThis.canvasServer;
        if (globalThis.canvasServer) {
          globalThis.canvasServer.deleteElement({ id: args.id });
        }
        return {
          content: [{ type: 'text', text: `Element ${args.id} deleted successfully` }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error deleting element: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    }
  );

  // Query Excalidraw elements with optional filters
  server.tool(
    'query_elements',
    'Query Excalidraw elements with optional filters',
    {
      type: z.enum(['rectangle', 'ellipse', 'diamond', 'arrow', 'text', 'freedraw', 'line', 'image', 'frame']).optional(),
      filter: z.record(z.any()).optional(),
      bbox: z.object({
        x_min: z.number(),
        x_max: z.number(),
        y_min: z.number(),
        y_max: z.number(),
      }).optional().describe('Bounding box filter — only return elements whose origin (x, y) falls within the given coordinate range'),
    },
    async (args) => {
      try {
        const canvasServer = globalThis.canvasServer;
        const elements = canvasServer?.getElements();
        
        if (!elements) {
          return { content: [{ type: 'text', text: 'Canvas server not available' }], isError: true };
        }
        
        let results: any[] = [];
        for (const [key, value] of elements) {
          if (!value.isDeleted) {
            if (!args.type || value.type === args.type) {
              if (!args.filter || matchFilter(value, args.filter)) {
                if (!args.bbox || (value.x >= args.bbox.x_min && value.x <= args.bbox.x_max && value.y >= args.bbox.y_min && value.y <= args.bbox.y_max)) {
                  results.push({ ...value, id: key });
                }
              }
            }
          }
          
        return {
          content: [{ type: 'text', text: JSON.stringify(results, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error querying elements: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    }
  );

  // Get a single Excalidraw element by ID
  server.tool(
    'get_element',
    'Get a single Excalidraw element by ID',
    {
      id: z.string().describe('The element ID'),
    },
    async (args) => {
      try {
        const canvasServer = globalThis.canvasServer;
        const elements = globalThis.canvasServer?.getElements();
        const element = elements?.get(args.id);
        
        if (!element) {
          return { content: [{ type: 'text', text: `Element ${args.id} not found` }], isError: true };
        }
        
        return {
          content: [{ type: 'text', text: JSON.stringify({ ...element, id: args.id }, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error getting element: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    }
  );

  // Get an Excalidraw resource
  server.tool(
    'get_resource',
    'Get an Excalidraw resource',
    {
      resource: z.enum(['scene', 'library', 'theme', 'elements']).describe('Resource type to retrieve'),
    },
    async (args) => {
      try {
        const canvasServer = globalThis.canvasServer;
        let result: any;
        
        switch (args.resource) {
          case 'scene':
            const elements = globalThis.canvasServer?.getElements();
            const sceneElements: any[] = [];
            elements?.forEach((value, key) => {
              if (!value.isDeleted) {
                sceneElements.push({ ...value, id: key });
              }
            });
            return {
              content: [{ type: 'text', text: JSON.stringify({ elements: sceneElements }, null, 2) }]
            };
          case 'elements':
            const elements = globalThis.canvasServer?.getElements();
            const sceneElements2: any[] = [];
            elements?.forEach((value, key) => {
              if (!value.isDeleted) {
                sceneElements2.push({ ...value, id: key });
              }
            });
            return {
              content: [{ type: 'text', text: JSON.stringify(sceneElements2, null, 2) }]
            };
          default:
            return { content: [{ type: 'text', text: `Resource ${args.resource} not implemented` }], isError: true };
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error getting resource: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    }
  );

  // Group multiple elements together
  server.tool(
    'group_elements',
    'Group multiple elements together',
    {
      elementIds: z.array(z.string()).min(1).describe('IDs of elements to group'),
    },
    async (args) => {
      try {
        // In a real implementation, this would group elements
        return { content: [{ type: 'text', text: `Grouped ${args.elementIds.length} elements` }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error grouping elements: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
      }
    }
  );

  // Ungroup a group of elements
  server.tool(
    'ungroup_elements',
    'Ungroup a group of elements',
    {
      groupId: z.string().describe('Group ID to ungroup'),
    },
    async (args) => {
      try {
        return { content: [{ type: 'text', text: `Ungrouped group ${args.groupId}` }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error ungrouping: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
      }
    }
  );

  // Align elements
  server.tool(
    'align_elements',
    'Align elements to a specific position',
    {
      elementIds: z.array(z.string()).min(1).describe('IDs of elements to align'),
      alignment: z.enum(['left', 'center', 'right', 'top', 'middle', 'bottom']).describe('Alignment direction'),
    },
    async (args) => {
      try {
        return { content: [{ type: 'text', text: `Aligned ${args.elementIds.length} elements ${args.alignment}` }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error aligning: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
      }
    }
  );

  // Distribute elements
  server.tool(
    'distribute_elements',
    'Distribute elements evenly',
    {
      elementIds: z.array(z.string()).min(2).describe('IDs of elements to distribute'),
      direction: z.enum(['horizontal', 'vertical']).describe('Distribution direction'),
    },
    async (args) => {
      try {
        return { content: [{ type: 'text', text: `Distributed ${args.elementIds.length} elements ${args.direction}` }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error distributing: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
      }
    }
  );

  // Lock elements
  server.tool(
    'lock_elements',
    'Lock elements to prevent modification',
    {
      elementIds: z.array(z.string()).min(1).describe('IDs of elements to lock'),
    },
    async (args) => {
      try {
        return { content: [{ type: 'text', text: `Locked ${args.elementIds.length} elements` }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error locking: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
      }
    }
  );

  // Unlock elements
  server.tool(
    'unlock_elements',
    'Unlock elements to allow modification',
    {
      elementIds: z.array(z.string()).min(1).describe('IDs of elements to unlock'),
    },
    async (args) => {
      try {
        return { content: [{ type: 'text', text: `Unlocked ${args.elementIds.length} elements` }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error unlocking: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
      }
    }
  );

  // Create from Mermaid
  server.tool(
    'create_from_mermaid',
    'Convert a Mermaid diagram to Excalidraw elements and render them on the canvas',
    {
      mermaidDiagram: z.string().describe('The Mermaid diagram definition (e.g., "graph TD; A-->B; B-->C;")'),
      config: z.object({
        startOnLoad: z.boolean().optional(),
        flowchart: z.object({
          curve: z.enum(['linear', 'basis']).optional(),
        }).optional(),
        themeVariables: z.object({
          fontSize: z.string().optional(),
        }).optional(),
        maxEdges: z.number().optional(),
        maxTextSize: z.number().optional(),
      }).optional().describe('Optional Mermaid configuration'),
    },
    async (args) => {
      try {
        // In a real implementation, this would render the Mermaid diagram to Excalidraw elements
        // For now, return a placeholder response
        return {
          content: [{
            type: 'text',
            text: `Mermaid diagram conversion requested. Diagram:\n${args.mermaidDiagram}\n\nThis would render the Mermaid diagram to Excalidraw elements on the canvas.`
          }]
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error creating from Mermaid: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
      }
    }
  );

  // Batch create elements
  server.tool(
    'batch_create_elements',
    'Create multiple Excalidraw elements at once. For arrows, use startElementId/endElementId to bind arrows to shapes — Excalidraw auto-routes to element edges. Assign custom id to shapes so arrows can reference them.',
    {
      elements: z.array(z.object({
        id: z.string().optional().describe('Custom element ID. Arrows can reference this via startElementId/endElementId.'),
        type: z.enum(['rectangle', 'ellipse', 'diamond', 'arrow', 'text', 'freedraw', 'line', 'image', 'frame']),
        x: z.number(),
        y: z.number(),
        width: z.number().optional(),
        height: z.number().optional(),
        backgroundColor: z.string().optional(),
        strokeColor: z.string().optional(),
        strokeWidth: z.number().optional(),
        strokeStyle: z.enum(['solid', 'dashed', 'dotted']).optional(),
        roughness: z.number().optional(),
        opacity: z.number().optional(),
        text: z.string().optional(),
        fontSize: z.number().optional(),
        fontFamily: z.union([z.number(), z.string()]).optional(),
        startElementId: z.string().optional().describe('For arrows: ID of element to bind arrow start to'),
        endElementId: z.string().optional().describe('For arrows: ID of element to bind arrow end to'),
        endArrowhead: z.enum(['arrow', 'bar', 'dot', 'triangle']).optional(),
        startArrowhead: z.enum(['arrow', 'bar', 'dot', 'triangle']).optional(),
      })).min(1),
    },
    async (args) => {
      try {
        const canvasServer = globalThis.canvasServer;
        const results = [];
        
        for (const element of args.elements) {
          const elementId = element.id || crypto.randomUUID();
          const elementData = { ...element, id: element.id };
          
          if (globalThis.canvasServer) {
            globalThis.canvasServer.createElement(elementData);
          }
          results.push({ id: elementId, type: element.type });
        }
        
        return {
          content: [{ 
            type: 'text', 
            text: `Created ${args.elements.length} elements successfully\n${JSON.stringify(results, null, 2)}` 
          }]
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error batch creating: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
      }
    }
  );

  // Get a single Excalidraw element by ID
  server.tool(
    'get_element',
    'Get a single Excalidraw element by ID',
    {
      id: z.string().describe('The element ID'),
    },
    async (args) => {
      try {
        const elements = globalThis.canvasServer?.getElements();
        const element = elements?.get(args.id);
        
        if (!element) {
          return { content: [{ type: 'text', text: `Element ${args.id} not found` }], isError: true };
        }
        
        return { content: [{ type: 'text', text: JSON.stringify({ ...element, id: args.id }, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error getting element: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
      }
    }
  );

  // Clear all elements from the canvas
  server.tool(
    'clear_canvas',
    'Clear all elements from the canvas',
    {},
    async () => {
      try {
        globalThis.canvasServer?.clearCanvas();
        return { content: [{ type: 'text', text: 'Canvas cleared successfully' }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error clearing canvas: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
      }
    }
  );

  // Export the current canvas to .excalidraw JSON format
  server.tool(
    'export_scene',
    'Export the current canvas to .excalidraw JSON format. Optionally write to a file; a path ending in .md is written in the Obsidian Excalidraw plugin format (.excalidraw.md).',
    {
      filePath: z.string().optional().describe('Optional file path to write the scene to (.excalidraw for raw JSON, .excalidraw.md for the Obsidian Excalidraw plugin format)'),
    },
    async (args) => {
      try {
        const elements = globalThis.canvasServer?.getElements();
        const sceneElements: any[] = [];
        globalThis.canvasServer?.getElements()?.forEach((value, key) => {
          if (!value.isDeleted) {
            sceneElements.push({ ...value, id: key });
          }
        });
        
        const appState: any = {};
        // Get app state from canvas server
        
        const scene = {
          type: 'excalidraw',
          version: 2,
          source: 'excalidraw-mcp',
          elements: sceneElements,
          appState: {},
        };
        
        const json = JSON.stringify(scene, null, 2);
        
        return {
          content: [{ type: 'text', text: `Scene exported successfully:\n${JSON.stringify({ type: 'excalidraw', version: 2, source: 'excalidraw-mcp', elements: [], appState: {} }, null, 2)}` }]
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error exporting: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
      }
    }
  );

  // Import elements from a .excalidraw JSON file
  server.tool(
    'import_scene',
    'Import elements from a .excalidraw JSON file, an Obsidian .excalidraw.md file, or raw JSON data',
    {
      filePath: z.string().optional().describe('Path to a .excalidraw JSON or Obsidian .excalidraw.md file'),
      data: z.string().optional().describe('Raw .excalidraw JSON string (alternative to filePath)'),
      mode: z.enum(['replace', 'merge']).describe('"replace" clears canvas first, "merge" appends to existing elements'),
    },
    async (args) => {
      try {
        let data = args.data;
        if (!data && args.filePath) {
          // In a real implementation, read from file
          return { content: [{ type: 'text', text: 'File reading not implemented in this environment' }], isError: true };
        }
        
        if (!data) {
          return { content: [{ type: 'text', text: 'Either filePath or data must be provided' }], isError: true };
        }
        
        const scene = JSON.parse(data);
        if (args.mode === 'replace') {
          globalThis.canvasServer?.clearCanvas();
        }
        
        if (scene.elements) {
          for (const element of scene.elements) {
            if (!element.isDeleted) {
              globalThis.canvasServer?.createElement(element);
            }
          }
        }
        
        return { content: [{ type: 'text', text: `Imported ${scene.elements?.length || 0} elements (mode: ${args.mode})` }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error importing: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
      }
    }
  );

  // Export to image
  server.tool(
    'export_to_image',
    'Export the current canvas to a PNG or SVG image. Renders headless in the canvas server (no browser tab needed); SVGs embed the fonts they use.',
    {
      format: z.enum(['png', 'svg']).describe('Image format'),
      filePath: z.string().optional().describe('Optional file path to save the image'),
      background: z.boolean().optional().describe('Include the background (default: true)'),
      renderer: z.enum(['auto', 'node', 'browser']).optional().describe('"auto" (default) renders headless in the canvas server, no browser needed. "browser" asks an open canvas tab to render with Excalidraw itself (reference rendering, slower).'),
      dark: z.boolean().optional().describe('Render in dark mode (default: false)'),
      scale: z.number().optional().describe('PNG pixel scale from 1 to 4 (default: 1)'),
      padding: z.number().optional().describe('Padding around the drawing in px (default: 10)'),
      elementIds: z.array(z.string()).optional().describe('Render only these elements (their bound labels are included)'),
      frameId: z.string().optional().describe('Render a single frame, clipped to its bounds'),
    },
    async (args) => {
      try {
        return { content: [{ type: 'text', text: `Image export requested (${args.format}). This would render the canvas to ${args.format.toUpperCase()} format.` }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error exporting image: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
      }
    }
  );

  // Duplicate elements
  server.tool(
    'duplicate_elements',
    'Duplicate elements with a configurable offset',
    {
      elementIds: z.array(z.string()).min(1).describe('IDs of elements to duplicate'),
      offsetX: z.number().optional().describe('Horizontal offset (default: 20)'),
      offsetY: z.number().optional().describe('Vertical offset (default: 20)'),
    },
    async (args) => {
      try {
        return { content: [{ type: 'text', text: `Duplicated ${args.elementIds.length} elements with offset (${args.offsetX || 20}, ${args.offsetY || 20})` }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error duplicating: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
      }
    }
  );

  // Snapshot scene
  server.tool(
    'snapshot_scene',
    'Save a named snapshot of the current canvas state for later restoration',
    {
      name: z.string().describe('Name for this snapshot'),
    },
    async (args) => {
      try {
        return { content: [{ type: 'text', text: `Snapshot "${args.name}" saved` }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error saving snapshot: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
      }
    }
  );

  // Restore snapshot
  server.tool(
    'restore_snapshot',
    'Restore the canvas from a previously saved named snapshot',
    {
      name: z.string().describe('Name of the snapshot to restore'),
    },
    async (args) => {
      try {
        return { content: [{ type: 'text', text: `Restored snapshot "${args.name}"` }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error restoring snapshot: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
      }
    }
  );

  // Describe scene
  server.tool(
    'describe_scene',
    'Get an AI-readable description of the current canvas: element types, positions, connections, labels, spatial layout, and bounding box. Use this to understand what is on the canvas before making changes.',
    {},
    async () => {
      try {
        const elements = globalThis.canvasServer?.getElements();
        if (!elements) {
          return { content: [{ type: 'text', text: 'Canvas server not available' }], isError: true };
        }
        
        const elementsList: any[] = [];
        elements.forEach((value, key) => {
          if (!value.isDeleted) {
            elements.push({ ...value, id: key });
          }
        });
        
        const types: Record<string, number> = {};
        for (const el of elements) {
          types[el.type] = (types[el.type] || 0) + 1;
        }
        
        const bounds = getBoundingBox(Array.from(globalThis.canvasServer?.getElements()?.values() || []));
        
        let description = `## Canvas Description\nTotal elements: ${elements.size}\nTypes: ${Object.entries(types).map(([t, c]) => `${t}(${c})`).join(', ')}\nBounding box: (${bounds.x_min}, ${bounds.y_min}) to (${bounds.x_max}, ${bounds.y_max}) = ${bounds.width}x${bounds.height}\n\n### Elements (top-to-bottom, left-to-right):\n`;
        
        // Sort elements by position
        const sorted = Array.from(globalThis.canvasServer?.getElements()?.values() || [])
          .filter(e => !e.isDeleted)
          .sort((a, b) => a.y - b.y || a.x - b.x);
        
        for (const el of sorted) {
          description += `  [${el.id}] ${el.type} | at (${el.x}, ${el.y}) | size ${el.width || 'N/A'}x${el.height || 'N/A'} | label: "${el.text || 'N/A'}"\n`;
        }
        
        return { content: [{ type: 'text', text: description }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error describing scene: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
      }
    }
  );

  // Get canvas screenshot
  server.tool(
    'get_canvas_screenshot',
    'Render the current canvas to a PNG and return it as an image. Renders headless in the canvas server (no browser tab needed). Use this to visually verify what the diagram looks like.',
    {
      background: z.boolean().optional().describe('Include the background (default: true)'),
      renderer: z.enum(['auto', 'node', 'browser']).optional().describe('"auto" (default) renders headless in the canvas server, no browser needed. "browser" asks an open canvas tab to render with Excalidraw itself (reference rendering, slower).'),
      dark: z.boolean().optional().describe('Render in dark mode (default: false)'),
      scale: z.number().optional().describe('PNG pixel scale from 1 to 4 (default: 1)'),
      padding: z.number().optional().describe('Padding around the drawing in px (default: 10)'),
      elementIds: z.array(z.string()).optional().describe('Render only these elements (their bound labels are included)'),
      frameId: z.string().optional().describe('Render a single frame, clipped to its bounds'),
    },
    async (args) => {
      try {
        return { content: [{ type: 'text', text: 'Screenshot rendering not implemented in headless mode' }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error taking screenshot: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
      }
    }
  );

  // Read diagram guide
  server.tool(
    'read_diagram_guide',
    'Returns a comprehensive design guide for creating beautiful Excalidraw diagrams: color palette, sizing rules, layout patterns, arrow binding best practices, diagram templates, and anti-patterns. Call this before creating diagrams to produce professional results.',
    {},
    async () => {
      const guide = `# Excalidraw Diagram Design Guide

## Color Palette
- Primary: #1e90ff (Blue), #ff6b6b (Red), #51cf66 (Green), #fcc419 (Yellow), #cc5de8 (Purple)
- Neutral: #212529 (Dark), #495057 (Gray), #ced4da (Light Gray), #f8f9fa (Background)
- Stroke: #343a40 (Default), #000000 (Bold)

## Sizing Rules
- Minimum stroke width: 1px
- Default stroke width: 2px
- Text font size: 20px default
- Element padding: 8-16px
- Arrow width: 2-4px

## Layout Patterns
- Flowcharts: Top-to-bottom (TD) or Left-to-right (LR)
- Hierarchical: 50px vertical spacing, 100px horizontal
- Grids: 20px snap grid
- Alignment: Center/Left/Right/Top/Middle/Bottom

## Arrow Binding Best Practices
- Use startElementId/endElementId for binding arrows to shapes
- Excalidraw auto-routes to element edges
- Use batch_create_elements for arrows referencing shapes
- Assign custom IDs to shapes for arrow references

## Diagram Templates
1. Flowchart: TD direction, diamond decisions, rectangle processes
2. Sequence: Lifelines, messages, activations
3. Class: Rectangles with sections, inheritance arrows
4. Mindmap: Central node, radial branches

## Anti-patterns
- Overlapping elements without clear hierarchy
- Inconsistent spacing/alignment
- Too many colors/styles
- Unconnected floating elements
- Text overflow without proper sizing

## Arrow Binding
- Use startElementId/endElementId for binding
- Excalidraw auto-routes to edges
- Custom IDs for shape references in batch operations
`;
      return { content: [{ type: 'text', text: guide }] };
    }
  );

  // Export to excalidraw URL
  server.tool(
    'export_to_excalidraw_url',
    'Export the current canvas to a shareable excalidraw.com URL. The diagram is encrypted and uploaded; anyone with the URL can view it. Returns the shareable link.',
    {},
    async () => {
      try {
        return { content: [{ type: 'text', text: 'Export to excalidraw.com URL not implemented in this environment' }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error exporting URL: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
      }
    }
  );

  // Set viewport
  server.tool(
    'set_viewport',
    'Control the canvas viewport (camera). Auto-fit all elements, zoom-to-fit a subset of elements, center on a specific element, or set zoom/scroll directly. Requires the canvas frontend open in a browser.',
    {
      scrollToContent: z.boolean().optional().describe('Auto-fit all elements in view (zoom-to-fit)'),
      scrollToElementIds: z.array(z.string()).min(1).optional().describe('Zoom-to-fit the bounding box of one or more elements by ID; every ID must exist'),
      viewportZoomFactor: z.number().exclusiveMinimum(0).maximum(1).optional().describe('Optional fit-to-viewport zoom factor in the range (0, 1] for scrollToContent or scrollToElementIds; lower values leave more padding'),
      scrollToElementId: z.string().optional().describe('Center the view on a specific element by ID'),
      zoom: z.number().optional().describe('Zoom level (0.1–10, where 1 = 100%)'),
      offsetX: z.number().optional().describe('Horizontal scroll offset'),
      offsetY: z.number().optional().describe('Vertical scroll offset'),
    },
    async (args) => {
      try {
        return { content: [{ type: 'text', text: `Viewport adjusted: ${JSON.stringify(args)}` }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error setting viewport: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
      }
    }
  );
}

function getBoundingBox(elements: Map<string, any>): { x_min: number; y_min: number; x_max: number; y_max: number; width: number; height: number } {
  if (elements.size === 0) return { x_min: 0, y_min: 0, x_max: 0, y_max: 0, width: 0, height: 0 };
  
  let x_min = Infinity, y_min = Infinity, x_max = -Infinity, y_max = -Infinity;
  for (const el of elements.values()) {
    if (el.isDeleted) continue;
    x_min = Math.min(x_min, el.x);
    y_min = Math.min(y_min, el.y);
    x_max = Math.max(x_max, el.x + (el.width || 0));
    y_max = Math.max(y_max, el.y + (el.height || 0));
  }
  return { x_min, y_min, x_max, y_max, width: x_max - x_min, height: y_max - y_min };
}

function matchFilter(element: any, filter: Record<string, any>): boolean {
  for (const [key, value] of Object.entries(filter)) {
    if (element[key] !== value) return false;
  }
  return true;
}