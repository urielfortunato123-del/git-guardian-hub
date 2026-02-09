import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-github-token",
};

const GITHUB_API = "https://api.github.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const githubToken = req.headers.get("x-github-token");
    if (!githubToken) {
      return new Response(JSON.stringify({ error: "GitHub token is required. Add your Personal Access Token in settings." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, params } = await req.json();

    const ghHeaders = {
      "Authorization": `Bearer ${githubToken}`,
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "LovHub-Agent",
    };

    let result: unknown;

    switch (action) {
      case "user": {
        const r = await fetch(`${GITHUB_API}/user`, { headers: ghHeaders });
        if (!r.ok) throw new Error(`GitHub auth failed: ${r.status}`);
        result = await r.json();
        break;
      }

      case "repos": {
        const page = params?.page || 1;
        const perPage = params?.per_page || 30;
        const sort = params?.sort || "updated";
        const r = await fetch(
          `${GITHUB_API}/user/repos?sort=${sort}&per_page=${perPage}&page=${page}&type=all`,
          { headers: ghHeaders }
        );
        if (!r.ok) throw new Error(`Failed to fetch repos: ${r.status}`);
        result = await r.json();
        break;
      }

      case "repo_contents": {
        const { owner, repo, path = "", ref } = params;
        let url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`;
        if (ref) url += `?ref=${ref}`;
        const r = await fetch(url, { headers: ghHeaders });
        if (!r.ok) throw new Error(`Failed to fetch contents: ${r.status}`);
        result = await r.json();
        break;
      }

      case "branches": {
        const { owner, repo } = params;
        const r = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/branches`, { headers: ghHeaders });
        if (!r.ok) throw new Error(`Failed to fetch branches: ${r.status}`);
        result = await r.json();
        break;
      }

      case "create_branch": {
        const { owner, repo, branch, from_sha } = params;
        const r = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/refs`, {
          method: "POST",
          headers: { ...ghHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: from_sha }),
        });
        if (!r.ok) throw new Error(`Failed to create branch: ${r.status}`);
        result = await r.json();
        break;
      }

      case "create_or_update_file": {
        const { owner, repo, path, message, content, branch, sha } = params;
        const body: Record<string, unknown> = {
          message,
          content: btoa(content), // base64
          branch,
        };
        if (sha) body.sha = sha;
        const r = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, {
          method: "PUT",
          headers: { ...ghHeaders, "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error(`Failed to update file: ${r.status}`);
        result = await r.json();
        break;
      }

      case "create_pr": {
        const { owner, repo, title, body, head, base } = params;
        const r = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls`, {
          method: "POST",
          headers: { ...ghHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({ title, body, head, base }),
        });
        if (!r.ok) throw new Error(`Failed to create PR: ${r.status}`);
        result = await r.json();
        break;
      }

      case "file_content": {
        const { owner, repo, path, ref } = params;
        let url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`;
        if (ref) url += `?ref=${ref}`;
        const r = await fetch(url, { headers: ghHeaders });
        if (!r.ok) throw new Error(`Failed to fetch file: ${r.status}`);
        const data = await r.json();
        // Decode base64 content
        if (data.content) {
          data.decoded_content = atob(data.content.replace(/\n/g, ""));
        }
        result = data;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("GitHub proxy error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
