import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate with admin secret
    const authHeader = req.headers.get("x-admin-key");
    const adminKey = Deno.env.get("LICENSE_ADMIN_KEY");

    if (!adminKey || authHeader !== adminKey) {
      return json({ success: false, error: "Não autorizado" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { license_key, email, max_activations, expires_at } = await req.json();

    if (!license_key || !email) {
      return json({ success: false, error: "license_key e email são obrigatórios" }, 400);
    }

    // Check if key already exists
    const { data: existing } = await supabase
      .from("licenses")
      .select("id")
      .eq("license_key", license_key)
      .maybeSingle();

    if (existing) {
      return json({ success: false, error: "Chave já existe" }, 409);
    }

    // Insert new license
    const { data, error } = await supabase.from("licenses").insert({
      license_key,
      user_email: email.toLowerCase().trim(),
      max_activations: max_activations || 1,
      expires_at: expires_at || null,
      is_active: true,
    }).select().single();

    if (error) {
      return json({ success: false, error: error.message }, 500);
    }

    return json({ success: true, license: data });
  } catch (err) {
    return json({ success: false, error: String(err) }, 500);
  }
});
