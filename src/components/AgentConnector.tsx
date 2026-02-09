import { useState, useEffect, useCallback } from "react";
import { Wifi, WifiOff, Settings, Loader2, Server } from "lucide-react";

interface AgentConnectorProps {
  onStatusChange?: (connected: boolean) => void;
}

const DEFAULT_AGENT_URL = "http://127.0.0.1:8787";

export function AgentConnector({ onStatusChange }: AgentConnectorProps) {
  const [agentUrl, setAgentUrl] = useState(() => localStorage.getItem("agent_url") || DEFAULT_AGENT_URL);
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const checkHealth = useCallback(async () => {
    setChecking(true);
    try {
      const r = await fetch(`${agentUrl}/health`, { signal: AbortSignal.timeout(3000) });
      const ok = r.ok;
      setConnected(ok);
      onStatusChange?.(ok);
    } catch {
      setConnected(false);
      onStatusChange?.(false);
    } finally {
      setChecking(false);
    }
  }, [agentUrl, onStatusChange]);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const saveUrl = (url: string) => {
    setAgentUrl(url);
    localStorage.setItem("agent_url", url);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={checkHealth}
        disabled={checking}
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors ${
          connected
            ? "bg-green-500/15 text-green-400 hover:bg-green-500/25"
            : "bg-red-500/15 text-red-400 hover:bg-red-500/25"
        }`}
      >
        {checking ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : connected ? (
          <Wifi className="w-3 h-3" />
        ) : (
          <WifiOff className="w-3 h-3" />
        )}
        <span>{connected ? "Agente Online" : "Agente Offline"}</span>
      </button>

      <div className="relative">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {showSettings && (
          <div className="absolute right-0 top-full mt-1 w-64 bg-popover border border-border rounded-lg shadow-lg z-50 p-3">
            <label className="text-xs text-muted-foreground block mb-1">URL do Agente Local</label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={agentUrl}
                onChange={e => saveUrl(e.target.value)}
                className="flex-1 text-xs bg-input border border-border rounded px-2 py-1.5 text-foreground"
                placeholder="http://127.0.0.1:8787"
              />
              <button
                onClick={() => { checkHealth(); setShowSettings(false); }}
                className="text-xs bg-primary text-primary-foreground px-2 py-1.5 rounded"
              >
                Testar
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Rode o agente: <code className="bg-secondary px-1 rounded">python agent.py</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function useAgentUrl(): string {
  return localStorage.getItem("agent_url") || DEFAULT_AGENT_URL;
}
