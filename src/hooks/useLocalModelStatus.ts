import { useState, useEffect, useCallback } from "react";

const CHECK_INTERVAL = 15_000;

/** Skip local polling when running on a remote preview (not localhost/electron) */
function isLocalEnvironment(): boolean {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".local") || navigator.userAgent.includes("Electron");
}

export function useLocalModelStatus(endpoints: string[]) {
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});
  const [checking, setChecking] = useState(false);

  const checkEndpoint = useCallback(async (baseUrl: string): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const resp = await fetch(`${baseUrl}/models`, { method: "GET", signal: controller.signal });
      clearTimeout(timeout);
      return resp.ok;
    } catch {
      return false;
    }
  }, []);

  const checkAll = useCallback(async () => {
    if (!isLocalEnvironment()) return;
    setChecking(true);
    const results: Record<string, boolean> = {};
    await Promise.all(endpoints.map(async (url) => { results[url] = await checkEndpoint(url); }));
    setStatuses(results);
    setChecking(false);
  }, [endpoints, checkEndpoint]);

  useEffect(() => {
    if (endpoints.length === 0 || !isLocalEnvironment()) return;
    checkAll();
    const interval = setInterval(checkAll, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [endpoints, checkAll]);

  return { statuses, checking, retry: checkAll };
}
