import { useState, useCallback, useEffect } from "react";

interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  public_repos: number;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
  default_branch: string;
  html_url: string;
  owner: { login: string };
}

export function useGitHub() {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem("github_pat"));
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github-proxy`;

  const callGitHub = useCallback(async (action: string, params?: Record<string, unknown>) => {
    if (!token) throw new Error("GitHub token not configured");

    const resp = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        "x-github-token": token,
      },
      body: JSON.stringify({ action, params }),
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      throw new Error(data.error || `GitHub API error: ${resp.status}`);
    }

    return resp.json();
  }, [token, apiUrl]);

  const setToken = useCallback((pat: string | null) => {
    if (pat) {
      localStorage.setItem("github_pat", pat);
    } else {
      localStorage.removeItem("github_pat");
    }
    setTokenState(pat);
    setUser(null);
    setRepos([]);
  }, []);

  const connect = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const userData = await callGitHub("user");
      setUser(userData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect");
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [token, callGitHub, setToken]);

  const fetchRepos = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await callGitHub("repos", { page, per_page: 50, sort: "updated" });
      setRepos(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch repos");
    } finally {
      setIsLoading(false);
    }
  }, [callGitHub]);

  // Auto-connect on mount if token exists
  useEffect(() => {
    if (token && !user) {
      connect();
    }
  }, [token, user, connect]);

  // Auto-fetch repos after connecting
  useEffect(() => {
    if (user && repos.length === 0) {
      fetchRepos();
    }
  }, [user, repos.length, fetchRepos]);

  return {
    token,
    setToken,
    user,
    repos,
    isLoading,
    error,
    connect,
    fetchRepos,
    callGitHub,
    isConnected: !!user,
  };
}
