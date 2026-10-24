import { useState, useEffect } from 'react';
import { mcpService } from '../services/mcpService';
import { MCPConnectionConfig } from '../types/mcp.types';

export const MCPManager: React.FC = () => {
  const [connections, setConnections] = useState<MCPConnectionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newConnection, setNewConnection] = useState<Partial<MCPConnectionConfig>>({
    id: '',
    name: '',
    transport: 'http',
    url: '',
    enabled: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mcpService.getConnections();
      setConnections(data);
    } catch (err) {
      setError('Failed to load MCP connections');
      console.error('Failed to load MCP connections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await mcpService.addConnection(newConnection as MCPConnectionConfig);
      setShowForm(false);
      setNewConnection({ id: '', name: '', transport: 'http', url: '', enabled: true });
      setSuccess('Connection added successfully');
      loadConnections();
    } catch (err) {
      setError('Failed to add connection');
      console.error('Failed to add connection:', err);
    }
  };

  const handleConnect = async (id: string) => {
    setError(null);
    setSuccess(null);
    try {
      await mcpService.connect(id);
      setSuccess('Connected successfully');
      loadConnections();
    } catch (err) {
      setError('Failed to connect');
      console.error('Failed to connect:', err);
    }
  };

  const handleDisconnect = async (id: string) => {
    setError(null);
    setSuccess(null);
    try {
      await mcpService.disconnect(id);
      setSuccess('Disconnected successfully');
      loadConnections();
    } catch (err) {
      setError('Failed to disconnect');
      console.error('Failed to disconnect:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this connection?')) return;
    setError(null);
    setSuccess(null);
    try {
      await mcpService.deleteConnection(id);
      setSuccess('Connection deleted');
      loadConnections();
    } catch (err) {
      setError('Failed to delete connection');
      console.error('Failed to delete:', err);
    }
  };

  const transportOptions = [
    { value: 'http', label: 'HTTP' },
    { value: 'sse', label: 'SSE (Server-Sent Events)' },
    { value: 'stdio', label: 'STDIO (Local Process)' },
  ];

  if (loading) return <div className="p-4 text-center">Loading...</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-[var(--color-text-primary)]">MCP Connections</h2>
      <p className="text-sm text-[var(--color-text-secondary)] mb-4">
        Manage Model Context Protocol (MCP) server connections to extend the AI agent with external tools and data sources.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-sm">
          {success}
        </div>
      )}

      <button
        onClick={() => setShowForm(true)}
        className="mb-4 px-4 py-2 rounded-lg bg-[var(--color-accent-primary)] text-white font-medium hover:opacity-90 transition-opacity"
      >
        Add Connection
      </button>

      {showForm && (
        <form onSubmit={handleAddConnection} className="mb-4 p-4 rounded-lg glass border border-[var(--color-border-default)] space-y-3">
          <h3 className="font-medium text-[var(--color-text-primary)]">Add MCP Connection</h3>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Connection ID</label>
            <input
              type="text"
              placeholder="e.g., jira, github, slack"
              value={newConnection.id}
              onChange={e => setNewConnection({ ...newConnection, id: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Name</label>
            <input
              type="text"
              placeholder="e.g., Jira, GitHub, Slack"
              value={newConnection.name}
              onChange={e => setNewConnection({ ...newConnection, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Transport</label>
            <select
              value={newConnection.transport}
              onChange={e => setNewConnection({ ...newConnection, transport: e.target.value as MCPConnectionConfig['transport'] })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
            >
              {transportOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {(newConnection.transport === 'http' || newConnection.transport === 'sse') && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">URL</label>
              <input
                type="url"
                placeholder="https://example.com/mcp"
                value={newConnection.url || ''}
                onChange={e => setNewConnection({ ...newConnection, url: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                required
              />
            </div>
          )}
          {(newConnection.transport === 'stdio') && (
            <>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Command</label>
                <input
                  type="text"
                  placeholder="npx"
                  value={newConnection.command || ''}
                  onChange={e => setNewConnection({ ...newConnection, command: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Args (space-separated)</label>
                <input
                  type="text"
                  placeholder='-y mcp-excalidraw-server'
                  value={newConnection.args?.join(' ') || ''}
                  onChange={e => setNewConnection({ ...newConnection, args: e.target.value.trim() ? e.target.value.trim().split(/\s+/) : [] })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                />
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">Enter arguments separated by spaces (e.g., "-y mcp-excalidraw-server")</p>
              </div>
            </>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[var(--color-accent-primary)] text-white font-medium hover:opacity-90 transition-opacity"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {connections.length === 0 ? (
        <div className="text-center py-8 text-[var(--color-text-secondary)]">
          No MCP connections configured. Click "Add Connection" to get started.
        </div>
      ) : (
        <ul className="space-y-3">
          {connections.map(conn => (
            <li key={conn.id} className="p-4 rounded-lg glass border border-[var(--color-border-default)]">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-[var(--color-text-primary)]">{conn.name}</h4>
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] mt-1">
                    <span className="px-2 py-0.5 rounded bg-[var(--color-bg-tertiary)]">{conn.transport.toUpperCase()}</span>
                    <span className={`px-2 py-0.5 rounded ${
                      conn.status === 'connected' ? 'bg-green-500/20 text-green-400' :
                      conn.status === 'error' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {conn.status || 'disconnected'}
                    </span>
                    {conn.toolsCount !== undefined && (
                      <span className="px-2 py-0.5 rounded bg-[var(--color-bg-tertiary)]">{conn.toolsCount} tools</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {conn.status !== 'connected' && (
                    <button
                      onClick={() => handleConnect(conn.id)}
                      className="px-3 py-1.5 text-sm rounded-lg bg-[var(--color-accent-primary)] text-white hover:opacity-90 transition-opacity"
                    >
                      Connect
                    </button>
                  )}
                  {conn.status === 'connected' && (
                    <button
                      onClick={() => handleDisconnect(conn.id)}
                      className="px-3 py-1.5 text-sm rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                    >
                      Disconnect
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(conn.id)}
                    className="px-3 py-1.5 text-sm rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};