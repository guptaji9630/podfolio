import { useEffect, useRef, useState } from 'react';
import { Excalidraw, convertToExcalidrawElements, restoreElements, reconcileElements } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import '@excalidraw/excalidraw/index.css';
import { API_CONFIG } from '../config/api.config';
import { retryAfterMs } from '../utils/retryAfter';

interface Scene { elements: ExcalidrawElement[]; revision: number }
const base = API_CONFIG.BASE_URL.replace(/\/$/, '');
const api = base.endsWith('/api') ? `${base}/mcp/canvas` : `${base}/api/mcp/canvas`;
export default function MCPCanvas() {
  const id = new URLSearchParams(window.location.search).get('canvasId') ?? '';
  const valid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  const [editor, setEditor] = useState<ExcalidrawImperativeAPI | null>(null);
  const [status, setStatus] = useState('Loading canvas…');
  const revision = useRef(-1);
  const signature = useRef('');
  const pending = useRef<readonly ExcalidrawElement[] | null>(null);
  const saveRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (!valid || !editor) return;
    const controller = new AbortController();
    let stopped = false;
    let busy = false;
    let rejected = false;
    let retryAt = 0;
    let failures = 0;
    let readAt = 0;
    let saveAt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const pollMs = 30_000;
    const normalize = (scene: Scene) => scene.elements.flatMap(e => typeof e.version === 'number' ? restoreElements([e], null) : convertToExcalidrawElements([e as NonNullable<Parameters<typeof convertToExcalidrawElements>[0]>[number]], { regenerateIds: false }));
    const apply = (scene: Scene) => {
      const elements = normalize(scene);
      revision.current = scene.revision; signature.current = JSON.stringify(elements);
      editor.updateScene({ elements });
      if (elements.length) editor.scrollToContent(elements, { fitToContent: true });
    };
    const request = async (options?: RequestInit) => {
      const response = await fetch(`${api}/${id}`, { ...options, signal: controller.signal });
      if (response.status === 429 || response.status === 503) {
        // A missing/unreadable header must not turn a 429 into another request loop.
        retryAt = Date.now() + retryAfterMs(response.headers.get('Retry-After'), response.status === 429 ? 900_000 : 30_000);
        setStatus(response.status === 429 ? 'Too many requests. Sync paused until the server allows retrying.' : 'Canvas unavailable. Waiting before retrying…');
        throw new Error('Retry later');
      }
      if (response.status >= 400 && response.status < 500 && response.status !== 409 && response.status !== 408) {
        rejected = true;
        setStatus(options?.method === 'PUT'
          ? 'Changes could not be saved. Simplify the drawing or reduce its size, then edit to retry.'
          : 'This canvas cannot be loaded. Check the link and reload.');
        throw new Error('Canvas request rejected');
      }
      return response;
    };
    const schedule = () => {
      clearTimeout(timer);
      if (stopped || busy || rejected || (document.hidden && !pending.current)) return;
      const due = pending.current && revision.current >= 0 ? saveAt : readAt;
      timer = setTimeout(() => void sync(), Math.max(0, due - Date.now(), retryAt - Date.now()));
    };
    const sync = async () => {
      if (stopped || busy) return;
      const writing = pending.current !== null && revision.current >= 0;
      if ((!writing && document.hidden) || Date.now() < Math.max(retryAt, writing ? saveAt : readAt)) { schedule(); return; }
      busy = true;
      const elements = writing ? pending.current : null;
      if (writing) { pending.current = null; setStatus('Saving…'); }
      try {
        const response = await request(writing ? { method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ elements, expectedRevision: revision.current }) } : undefined);
        if (writing && response.status === 409) {
          const latestResponse = await request();
          if (!latestResponse.ok) throw new Error();
          const latest = await latestResponse.json() as Scene;
          if (stopped) return;
          const merged = reconcileElements(editor.getSceneElementsIncludingDeleted(), normalize(latest) as unknown as Parameters<typeof reconcileElements>[1], editor.getAppState());
          revision.current = latest.revision; pending.current = merged; signature.current = JSON.stringify(merged);
          editor.updateScene({ elements: merged });
          saveAt = Date.now() + 1500;
          setStatus('Merging canvas updates…');
        } else {
          if (!response.ok) throw new Error();
          const scene = await response.json() as Scene;
          if (stopped) return;
          if (writing) revision.current = scene.revision;
          else if (!pending.current && scene.revision !== revision.current) apply(scene);
          if (!pending.current) setStatus('Saved');
        }
        failures = 0;
        retryAt = 0;
        // PUT already returns the saved revision; no follow-up GET is needed.
        readAt = Date.now() + pollMs;
      } catch {
        if (!stopped) {
          if (writing) pending.current = pending.current ?? elements;
          if (!rejected && retryAt <= Date.now()) {
            retryAt = Date.now() + Math.min(60_000, 5000 * 2 ** Math.min(failures++, 4));
            setStatus(writing ? 'Save failed. Retrying shortly…' : 'Canvas unavailable. Retrying shortly…');
          }
        }
      } finally { busy = false; schedule(); }
    };
    saveRef.current = () => { rejected = false; saveAt = Date.now() + 600; schedule(); };
    const visibility = () => schedule();
    const refresh = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent ||
          event.data?.type !== 'podfolio:canvas-updated' || event.data?.canvasId !== id) return;
      readAt = 0;
      schedule(); // Preserve any pending edits and the server's retry deadline.
    };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('message', refresh);
    schedule();
    return () => {
      stopped = true; controller.abort(); clearTimeout(timer); saveRef.current = () => {};
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('message', refresh);
    };
  }, [id, valid, editor]);
  if (!valid) return <p role="alert" className="p-6">Invalid canvas link. Create a drawing in the assistant first.</p>;
  return <main className="h-screen flex flex-col bg-white">
    <header className="px-4 py-2 flex flex-wrap items-center justify-between gap-2 border-b text-sm"><span role="status">{status}</span><a href={`${api}/${id}/export.svg`} download className="text-blue-700 underline">Download SVG</a></header>
    <div className="flex-1 min-h-0"><Excalidraw excalidrawAPI={setEditor} theme="light" UIOptions={{ canvasActions: { loadScene: false, saveToActiveFile: false, export: false }, tools: { image: false } }} onChange={elements => {
      const next = JSON.stringify(elements);
      if (revision.current < 0 || next === signature.current) return;
      signature.current = next; pending.current = elements; setStatus('Unsaved changes');
      saveRef.current();
    }} /></div>
  </main>;
}
