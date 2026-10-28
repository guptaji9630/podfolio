import { useEffect, useRef, useState } from 'react';
import { chatService } from '../services/chatService';
import { mcpService, type ToolCatalog } from '../services/mcpService';
import { MCPManager } from './MCPManager';
import { CHAT_HISTORY_LIMIT } from '../config/chat';
import { API_CONFIG } from '../config/api.config';
import type { ChatMessage } from '../types';

const examples = ['What are Abhishek’s skills?', 'List available tools', 'Draw a rectangle', 'Draw a flowchart', 'Export canvas'];
export default function MCPPlayground() {
  const [conversationId, setConversationId] = useState(() => crypto.randomUUID());
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [catalog, setCatalog] = useState<ToolCatalog>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [canvasUrl, setCanvasUrl] = useState('');
  const request = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    mcpService.listTools(conversationId, controller.signal).then(setCatalog).catch(() => { if (!controller.signal.aborted) setError('Tool discovery is unavailable. Check that the backend and canvas services are running.'); });
    return () => { controller.abort(); request.current?.abort(); };
  }, [conversationId]);
  const send = async (text = input) => {
    if (!text.trim() || request.current) return;
    const controller = new AbortController(); request.current = controller; setBusy(true); setError('');
    const next: ChatMessage[] = [...messages, { role: 'user' as const, content: text.trim() }].slice(-CHAT_HISTORY_LIMIT);
    setMessages(next); setInput('');
    try {
      const response = await chatService.sendMessage(next, true, controller.signal, conversationId);
      if (controller.signal.aborted) return;
      setMessages(prev => [...prev, { role: 'assistant' as const, content: response.message, ...response }].slice(-CHAT_HISTORY_LIMIT));
      if (response.canvasUrl) setCanvasUrl(response.canvasUrl);
    } catch (err) { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Request failed.'); }
    finally { if (request.current === controller) { request.current = null; setBusy(false); } }
  };
  return <main className="min-h-screen bg-[#1e1e1e] text-white">
    <header className="border-b border-white/10 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
      <div><a href="/" className="text-sm text-blue-300 hover:underline">← Portfolio</a><h1 className="text-xl font-semibold mt-2">Assistant playground</h1><p className="text-sm text-white/60 mt-1">Ask a question, create a drawing, or explore the available tools.</p></div>
      <button className="rounded-lg border border-white/20 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-blue-400" onClick={() => {
        request.current?.abort(); request.current = null; setBusy(false); setMessages([]); setCanvasUrl(''); setError(''); setConversationId(crypto.randomUUID());
      }}>New conversation</button>
    </header>
    <div className="grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="border-b lg:border-b-0 lg:border-r border-white/10 p-5 space-y-5 min-w-0">
        <section><h2 className="text-sm font-semibold mb-3">Try a request</h2><div className="flex flex-wrap lg:flex-col gap-2">{examples.map(text => <button key={text} disabled={busy} onClick={() => void send(text)} className="text-left text-xs border border-white/15 rounded-lg p-2 hover:bg-white/10 disabled:opacity-50 focus-visible:outline-blue-400">{text}</button>)}</div></section>
        <section><h2 className="text-sm font-semibold mb-3">Tool explorer</h2>{!catalog ? <p role="status" className="text-xs text-white/60">Loading tools…</p> : <>
          {catalog.servers.map(server => <p key={server.serverId} className="text-xs text-white/60 mb-3">{server.name}: {server.status}</p>)}
          {[...catalog.localTools, ...catalog.servers.flatMap(s => s.tools)].map(tool => <details key={tool.name} className="border-b border-white/10 py-2 text-xs"><summary className="cursor-pointer break-words">{tool.name}</summary><p className="text-white/60 my-2">{tool.description}</p><pre className="overflow-auto max-h-60 text-[10px]">{JSON.stringify(tool.inputSchema, null, 2)}</pre></details>)}
        </>}</section>
        <details><summary className="text-sm cursor-pointer">Manage connections</summary><MCPManager /></details>
      </aside>
      <section className="p-4 md:p-6 min-w-0 space-y-4">
        <div role="log" aria-live="polite" aria-label="Conversation" className="space-y-3 max-h-[50vh] overflow-y-auto">
          {!messages.length && <p className="text-white/50 text-sm py-6">Your conversation and drawings will appear here.</p>}
          {messages.map((m, i) => <article key={i} className={`rounded-xl p-3 text-sm whitespace-pre-wrap break-words ${m.role === 'user' ? 'bg-primary/20' : 'bg-white/5'}`}>
            <p className="text-xs text-white/50 mb-1">{m.role === 'user' ? 'You' : `Assistant${m.cached ? ' · cached' : m.source ? ` · ${m.source}` : ''}`}</p>{m.content}
            {m.downloadUrl && <a href={mcpDownloadUrl(m.downloadUrl)} className="block mt-2 text-blue-300 underline" download>Download SVG</a>}
            {m.toolCalls?.length ? <details className="mt-2 text-xs text-white/60"><summary className="cursor-pointer">Tool results</summary><pre className="overflow-auto max-h-48">{JSON.stringify(m.toolCalls, null, 2)}</pre></details> : null}
          </article>)}
          {busy && <p role="status" className="text-sm text-white/60">Working…</p>}
        </div>
        <form onSubmit={e => { e.preventDefault(); void send(); }} className="flex flex-col sm:flex-row gap-2">
          <label className="flex-1 text-xs text-white/60">Message<textarea rows={2} maxLength={4000} value={input} onChange={e => setInput(e.target.value)} className="block mt-1 w-full rounded-lg border border-white/20 bg-white/5 p-3 text-sm text-white focus:outline-blue-400" placeholder="Try: flowchart TD; A[Start] --> B[End]" /></label>
          <button disabled={busy || !input.trim()} className="self-end rounded-lg bg-primary px-5 py-3 text-sm disabled:opacity-40">Send</button>
        </form>
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        {canvasUrl && <section><div className="flex items-center justify-between mb-3"><h2 className="text-sm font-semibold">Your canvas</h2><a href={canvasUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-300 underline">Open canvas ↗</a></div><iframe title="Interactive Excalidraw canvas" src={canvasUrl} className="w-full h-[520px] rounded-xl border border-white/15 bg-white" /></section>}
      </section>
    </div>
  </main>;
}
// Relative API paths also work when the backend is configured on another host.
export function mcpDownloadUrl(path: string) {
  const base = API_CONFIG.BASE_URL.replace(/\/$/, '');
  return `${base}${base.endsWith('/api') ? path.replace(/^\/api/, '') : path}`;
}
