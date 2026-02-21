import { useState, useEffect, useCallback } from "react";

const CHECK_INTERVAL = 15_000;

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
    setChecking(true);
    const results: Record<string, boolean> = {};
    await Promise.all(endpoints.map(async (url) => { results[url] = await checkEndpoint(url); }));
    setStatuses(results);
    setChecking(false);
  }, [endpoints, checkEndpoint]);

  useEffect(() => {
    if (endpoints.length === 0) return;
    checkAll();
    const interval = setInterval(checkAll, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [endpoints, checkAll]);

  return { statuses, checking, retry: checkAll };
}
