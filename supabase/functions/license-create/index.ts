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
    const body = await req.json();
    const { api_secret, license_key, email, plan_type, duration_days } = body;

    // Authenticate with api_secret
    const adminKey = Deno.env.get("LICENSE_ADMIN_KEY");
    if (!adminKey || api_secret !== adminKey) {
      return json({ success: false, error: "Não autorizado" }, 401);
    }

    if (!license_key || !email) {
      return json({ success: false, error: "license_key e email são obrigatórios" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if key already exists
    const { data: existing } = await supabase
      .from("licenses")
      .select("id")
      .eq("license_key", license_key)
      .maybeSingle();

    if (existing) {
      return json({ success: false, error: "Chave já existe" }, 409);
    }

    // Calculate expiration from duration_days
    let expires_at: string | null = null;
    if (duration_days && duration_days > 0) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + duration_days);
      expires_at = expDate.toISOString();
    }

    // Map plan_type to max_activations
    const activationsMap: Record<string, number> = {
      standard: 1,
      professional: 3,
      enterprise: 10,
    };
    const max_activations = activationsMap[plan_type] || 1;

    // Insert new license
    const { data, error } = await supabase.from("licenses").insert({
      license_key,
      user_email: email.toLowerCase().trim(),
      max_activations,
      expires_at,
      is_active: true,
    }).select().single();

    if (error) {
      return json({ success: false, error: error.message }, 500);
    }

    return json({
      success: true,
      license: {
        id: data.id,
        license_key: data.license_key,
        email: data.user_email,
        plan_type: plan_type || "standard",
        max_activations: data.max_activations,
        expires_at: data.expires_at,
        created_at: data.created_at,
      },
    });
  } catch (err) {
    return json({ success: false, error: String(err) }, 500);
  }
});
