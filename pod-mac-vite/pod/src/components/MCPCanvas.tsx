import { useEffect, useRef, useState } from 'react';
import { Excalidraw, convertToExcalidrawElements, restoreElements, reconcileElements } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import '@excalidraw/excalidraw/index.css';
import { API_CONFIG } from '../config/api.config';

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
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const saveRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (!valid || !editor) return;
    const controller = new AbortController();
    let stopped = false; let saving = false; let loading = false;
    const normalize = (scene: Scene) => scene.elements.flatMap(e => typeof e.version === 'number' ? restoreElements([e], null) : convertToExcalidrawElements([e as NonNullable<Parameters<typeof convertToExcalidrawElements>[0]>[number]], { regenerateIds: false }));
    const apply = (scene: Scene) => {
      const elements = normalize(scene);
      revision.current = scene.revision; signature.current = JSON.stringify(elements);
      editor.updateScene({ elements });
      if (elements.length) editor.scrollToContent(elements, { fitToContent: true });
      setStatus('Saved');
    };
    const load = async () => {
      if (stopped || loading || saving || pending.current) return;
      loading = true;
      try {
        const response = await fetch(`${api}/${id}`, { signal: controller.signal });
        if (!response.ok) throw new Error();
        const scene = await response.json() as Scene;
        if (!stopped && !pending.current && !saving && scene.revision !== revision.current) apply(scene);
      } catch { if (!stopped) setStatus('Canvas unavailable. Retrying…'); }
      finally { loading = false; }
    };
    const save = async () => {
      if (stopped || saving || !pending.current || revision.current < 0) return;
      const elements = pending.current; pending.current = null; saving = true; setStatus('Saving…');
      try {
        const response = await fetch(`${api}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
          body: JSON.stringify({ elements, expectedRevision: revision.current }) });
        if (response.status === 409) {
          const latestResponse = await fetch(`${api}/${id}`, { signal: controller.signal });
          if (!latestResponse.ok) throw new Error();
          const latest = await latestResponse.json() as Scene;
          if (stopped) return;
          const merged = reconcileElements(editor.getSceneElementsIncludingDeleted(), normalize(latest) as unknown as Parameters<typeof reconcileElements>[1], editor.getAppState());
          revision.current = latest.revision; pending.current = merged; signature.current = JSON.stringify(merged);
          editor.updateScene({ elements: merged });
          setStatus('Merging canvas updates…');
        } else if (!response.ok) throw new Error();
        else { const scene = await response.json() as Scene; revision.current = scene.revision; setStatus('Saved'); }
      } catch { if (!stopped) { pending.current = pending.current ?? elements; setStatus('Save failed. Retrying…'); } }
      finally {
        saving = false;
        if (!stopped) {
          if (pending.current) timer.current = setTimeout(() => void save(), 1500);
          else void load();
        }
      }
    };
    saveRef.current = () => { void save(); };
    void load();
    const poll = setInterval(() => { if (pending.current) void save(); else void load(); }, 2000);
    return () => { stopped = true; controller.abort(); clearInterval(poll); clearTimeout(timer.current); saveRef.current = () => {}; };
  }, [id, valid, editor]);
  if (!valid) return <p role="alert" className="p-6">Invalid canvas link. Create a drawing in the assistant first.</p>;
  return <main className="h-screen flex flex-col bg-white">
    <header className="px-4 py-2 flex flex-wrap items-center justify-between gap-2 border-b text-sm"><span role="status">{status}</span><a href={`${api}/${id}/export.svg`} download className="text-blue-700 underline">Download SVG</a></header>
    <div className="flex-1 min-h-0"><Excalidraw excalidrawAPI={setEditor} theme="light" UIOptions={{ canvasActions: { loadScene: false, saveToActiveFile: false, export: false }, tools: { image: false } }} onChange={elements => {
      const next = JSON.stringify(elements);
      if (revision.current < 0 || next === signature.current) return;
      signature.current = next; pending.current = elements; setStatus('Unsaved changes'); clearTimeout(timer.current);
      timer.current = setTimeout(() => saveRef.current(), 600);
    }} /></div>
  </main>;
}
