import { WebSocketServer, WebSocket } from 'ws';
import { Doc, Text, Map as YMap, Array as YArray } from 'yjs';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

interface CanvasElement {
  id: string;
  type: 'rectangle' | 'ellipse' | 'diamond' | 'arrow' | 'text' | 'freedraw' | 'line' | 'image' | 'frame';
  x: number;
  y: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  roughness?: number;
  opacity?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: number;
  startElementId?: string;
  endElementId?: string;
  startArrowhead?: string;
  endArrowhead?: string;
  seed?: number;
  version?: number;
  versionNonce?: number;
  isDeleted?: boolean;
  groupIds?: string[];
  frameId?: string;
  roundness?: number;
  boundElements?: Array<{ id: string; type: string }>;
  updated?: number;
}

interface CanvasState {
  elements: Map<string, CanvasElement>;
  appState: {
    theme: 'light' | 'dark';
    viewBackgroundColor: string;
    gridSize: number;
    currentItemStrokeColor: string;
    currentItemBackgroundColor: string;
    currentItemStrokeWidth: number;
    currentItemStrokeStyle: 'solid' | 'dashed' | 'dotted';
    currentItemRoughness: number;
    currentItemOpacity: number;
    currentItemFontFamily: number;
    currentItemFontSize: number;
    scrollX: number;
    scrollY: number;
    zoom: number;
  };
  files: Map<string, any>;
  scene: {
    elements: CanvasElement[];
    appState: any;
  };
}

export class CanvasServer {
  private doc: Doc;
  private elements: YMap<CanvasElement>;
  private appState: YMap<any>;
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private sceneVersion: number = 0;

  constructor() {
    this.doc = new Doc();
    this.elements = this.doc.getMap('elements');
    this.appState = this.doc.getMap('appState');
    
    // Initialize default app state
    this.appState.set('theme', 'light');
    this.appState.set('viewBackgroundColor', '#ffffff');
    this.appState.set('gridSize', 20);
    this.appState.set('currentItemStrokeColor', '#000000');
    this.appState.set('currentItemBackgroundColor', 'transparent');
    this.appState.set('currentItemStrokeWidth', 2);
    this.appState.set('currentItemStrokeStyle', 'solid');
    this.appState.set('currentItemRoughness', 1);
    this.appState.set('currentItemOpacity', 100);
    this.appState.set('currentItemFontFamily', 1);
    this.appState.set('currentItemFontSize', 20);
  }

  attachWebSocketServer(wss: WebSocketServer): void {
    this.wss = wss;
    
    wss.on('connection', (ws: WebSocket, req) => {
      console.log('New WebSocket connection');
      this.clients.add(ws);
      
      // Send initial state
      this.sendState(ws);
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      });
      
      ws.on('close', () => {
        this.clients.delete(ws);
        console.log('WebSocket disconnected');
      });
      
      ws.on('error', (err) => {
        console.error('WebSocket error:', err);
        this.clients.delete(ws);
      });
    });
  }

  private sendState(ws: WebSocket): void {
    const elements: any[] = [];
    this.elements.forEach((value, key) => {
      if (!value.isDeleted) {
        elements.push({ ...value, id: key });
      }
    });
    
    const appState: any = {};
    this.appState.forEach((value, key) => {
      appState[key] = value;
    });
    
    ws.send(JSON.stringify({
      type: 'init',
      payload: {
        elements,
        appState,
        version: this.sceneVersion,
      }
    }));
  }

  private handleMessage(ws: WebSocket, message: any): void {
    switch (message.type) {
      case 'create':
        this.createElement(message.payload);
        break;
      case 'update':
        this.updateElement(message.payload);
        break;
      case 'delete':
        this.deleteElement(message.payload);
        break;
      case 'batch':
        this.batchOperation(message.payload);
        break;
      case 'get':
        this.getElement(ws, message.payload);
        break;
      case 'query':
        this.queryElements(ws, message.payload);
        break;
      case 'clear':
        this.clearCanvas();
        break;
      case 'sync':
        this.sendState(ws);
        break;
      case 'export':
        this.exportScene(ws, message.payload);
        break;
      case 'import':
        this.importScene(message.payload);
        break;
      case 'viewport':
        this.setViewport(ws, message.payload);
        break;
      case 'snapshot':
        this.snapshotScene(message.payload);
        break;
      case 'restore':
        this.restoreSnapshot(message.payload);
        break;
      case 'describe':
        this.describeScene(ws);
        break;
      case 'screenshot':
        this.getCanvasScreenshot(ws, message.payload);
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private createElement(payload: any): void {
    const element: CanvasElement = {
      id: payload.id || crypto.randomUUID(),
      type: payload.type,
      x: payload.x,
      y: payload.y,
      width: payload.width,
      height: payload.height,
      backgroundColor: payload.backgroundColor,
      strokeColor: payload.strokeColor,
      strokeWidth: payload.strokeWidth,
      strokeStyle: payload.strokeStyle,
      roughness: payload.roughness,
      opacity: payload.opacity,
      text: payload.text,
      fontSize: payload.fontSize,
      fontFamily: payload.fontFamily,
      startElementId: payload.startElementId,
      endElementId: payload.endElementId,
      startArrowhead: payload.startArrowhead,
      endArrowhead: payload.endArrowhead,
      seed: Math.floor(Math.random() * 1000000),
      version: 1,
      versionNonce: Math.floor(Math.random() * 1000000),
      isDeleted: false,
      groupIds: payload.groupIds,
      frameId: payload.frameId,
      roundness: payload.roundness,
      boundElements: payload.boundElements,
      updated: Date.now(),
    };
    
    this.elements.set(element.id, element);
    this.broadcast({ type: 'create', payload: element });
    this.sceneVersion++;
  }

  private updateElement(payload: any): void {
    const existing = this.elements.get(payload.id);
    if (!existing) return;
    
    const updated = { ...existing, ...payload, updated: Date.now(), version: (existing.version || 0) + 1 };
    this.elements.set(payload.id, updated);
    this.broadcast({ type: 'update', payload: updated });
    this.sceneVersion++;
  }

  private deleteElement(payload: { id: string }): void {
    const existing = this.elements.get(payload.id);
    if (!existing) return;
    
    const deleted = { ...existing, isDeleted: true, updated: Date.now() };
    this.elements.set(payload.id, deleted);
    this.broadcast({ type: 'delete', payload: { id: payload.id } });
    this.sceneVersion++;
  }

  private batchOperation(payload: { elements: any[] }): void {
    for (const element of payload.elements) {
      if (element.isDeleted) {
        this.deleteElement({ id: element.id });
      } else if (this.elements.has(element.id)) {
        this.updateElement(element);
      } else {
        this.createElement(element);
      }
    }
  }

  private getElement(ws: WebSocket, payload: { id: string }): void {
    const element = this.elements.get(payload.id);
    ws.send(JSON.stringify({
      type: 'element',
      payload: element || null
    }));
  }

  private queryElements(ws: WebSocket, payload: any): void {
    let elements: any[] = [];
    this.elements.forEach((value, key) => {
      if (!value.isDeleted) {
        if (!payload.type || value.type === payload.type) {
          if (!payload.filter || this.matchFilter(value, payload.filter)) {
            elements.push({ ...value, id: key });
          }
        }
      }
    });
    
    ws.send(JSON.stringify({
      type: 'query_result',
      payload: elements
    }));
  }

  private matchFilter(element: CanvasElement, filter: any): boolean {
    if (filter.type && element.type !== filter.type) return false;
    if (filter.bbox) {
      const { x_min, x_max, y_min, y_max } = filter.bbox;
      if (element.x < x_min || element.x > x_max || element.y < y_min || element.y > y_max) return false;
    }
    return true;
  }

  private clearCanvas(): void {
    this.elements.clear();
    this.broadcast({ type: 'clear' });
    this.sceneVersion++;
  }

  private exportScene(ws: WebSocket, payload: { format?: string }): void {
    const elements: any[] = [];
    this.elements.forEach((value, key) => {
      if (!value.isDeleted) {
        elements.push({ ...value, id: key });
      }
    });
    
    const appState: any = {};
    this.appState.forEach((value, key) => {
      appState[key] = value;
    });
    
    const scene = {
      type: 'excalidraw',
      version: 2,
      source: 'excalidraw-mcp',
      elements,
      appState,
    };
    
    ws.send(JSON.stringify({
      type: 'export',
      payload: {
        data: JSON.stringify(scene, null, 2),
        format: payload.format || 'json',
      }
    }));
  }

  private importScene(payload: { data: string; mode?: 'replace' | 'merge' }): void {
    try {
      const scene = JSON.parse(payload.data);
      if (scene.elements) {
        if (payload.mode === 'replace') {
          this.elements.clear();
        }
        
        for (const element of scene.elements) {
          if (!element.isDeleted) {
            this.elements.set(element.id, element);
          }
        }
        
        if (scene.appState) {
          for (const [key, value] of Object.entries(scene.appState)) {
            this.appState.set(key, value);
          }
        }
        
        this.broadcast({ type: 'import', payload: { count: scene.elements?.length || 0 } });
        this.sceneVersion++;
      } catch (e: unknown) {
        console.error('Import failed:', e);
      }
    }
  }

  private setViewport(ws: WebSocket, payload: any): void {
    // Broadcast viewport changes to all clients
    this.broadcast({ type: 'viewport', payload }, ws);
  }

  private snapshotScene(payload: { name: string }): void {
    // In a real implementation, this would save to persistent storage
    console.log('Snapshot saved:', payload.name);
  }

  private restoreSnapshot(payload: { name: string }): void {
    // In a real implementation, this would restore from persistent storage
    console.log('Snapshot restored:', payload.name);
  }

  private describeScene(ws: WebSocket): void {
    const elements: any[] = [];
    this.elements.forEach((value, key) => {
      if (!value.isDeleted) {
        elements.push({ ...value, id: key });
      }
    });
    
    const types: Record<string, number> = {};
    for (const el of elements) {
      types[el.type] = (types[el.type] || 0) + 1;
    }
    
    const bounds = this.getBoundingBox(elements);
    
    const description = `## Canvas Description
Total elements: ${elements.length}
Types: ${Object.entries(types).map(([t, c]) => `${t}(${c})`).join(', ')}
Bounding box: (${bounds.x_min}, ${bounds.y_min}) to (${bounds.x_max}, ${bounds.y_max}) = ${bounds.width}x${bounds.height}

### Elements (top-to-bottom, left-to-right):
${elements.map((el, i) => `  [${el.id}] ${el.type} | at (${el.x}, ${el.y}) | size ${el.width || 'N/A'}x${el.height || 'N/A'} | label: "${el.text || 'N/A'}"`).join('\n')}`;
    
    ws.send(JSON.stringify({
      type: 'describe',
      payload: { description }
    }));
  }

  private getCanvasScreenshot(ws: WebSocket, payload: any): void {
    // In a real implementation, this would render to PNG/SVG
    // For now, return a placeholder
    ws.send(JSON.stringify({
      type: 'screenshot',
      payload: { error: 'Screenshot rendering not implemented in headless mode' }
    }));
  }

  private getBoundingBox(elements: any[]): { x_min: number; y_min: number; x_max: number; y_max: number; width: number; height: number } {
    if (elements.length === 0) return { x_min: 0, y_min: 0, x_max: 0, y_max: 0, width: 0, height: 0 };
    
    let x_min = Infinity, y_min = Infinity, x_max = -Infinity, y_max = -Infinity;
    for (const el of elements) {
      x_min = Math.min(x_min, el.x);
      y_min = Math.min(y_min, el.y);
      x_max = Math.max(x_max, el.x + (el.width || 0));
      y_max = Math.max(y_max, el.y + (el.height || 0));
    }
    return { x_min, y_min, x_max, y_max, width: x_max - x_min, height: y_max - y_min };
  }

  private broadcast(message: any, exclude?: WebSocket): void {
    const data = JSON.stringify(message);
    for (const client of this.clients) {
      if (client !== exclude && client.readyState === 1) { // OPEN = 1
        client.send(data);
      }
    }
  }

  async shutdown(): Promise<void> {
    for (const client of this.clients) {
      client.close();
    }
    this.clients.clear();
    if (this.wss) {
      await new Promise<void>((resolve) => this.wss!.close(resolve));
    }
  }

  // Getters for external access
  getElements(): Map<string, CanvasElement> {
    return this.elements;
  }

  getAppState(): Map<string, any> {
    return this.appState;
  }
}