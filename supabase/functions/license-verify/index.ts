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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, license_key, hardware_id, email } = await req.json();

    if (!license_key) {
      return json({ valid: false, error: "Chave de licença obrigatória" }, 400);
    }

    // Lookup license
    const { data: license, error: lookupErr } = await supabase
      .from("licenses")
      .select("*")
      .eq("license_key", license_key)
      .maybeSingle();

    if (lookupErr || !license) {
      return json({ valid: false, error: "Chave de licença inválida" }, 403);
    }

    if (!license.is_active) {
      return json({ valid: false, error: "Licença revogada" }, 403);
    }

    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return json({ valid: false, error: "Licença expirada" }, 403);
    }

    // ── EMAIL VERIFICATION ──
    // If the license has an email set, the provided email must match
    if (license.user_email && email) {
      if (license.user_email.toLowerCase().trim() !== email.toLowerCase().trim()) {
        return json({ valid: false, error: "Email não corresponde à licença" }, 403);
      }
    }

    // --- ACTIVATE ---
    if (action === "activate") {
      if (!hardware_id) {
        return json({ valid: false, error: "Hardware ID obrigatório" }, 400);
      }
      if (!email) {
        return json({ valid: false, error: "Email obrigatório para ativação" }, 400);
      }

      // If license has no email yet, bind it now
      if (!license.user_email) {
        await supabase
          .from("licenses")
          .update({ user_email: email.toLowerCase().trim() })
          .eq("id", license.id);
      }

      // Check existing activation for this hardware
      const { data: existing } = await supabase
        .from("license_activations")
        .select("*")
        .eq("license_id", license.id)
        .eq("hardware_id", hardware_id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("license_activations")
          .update({ is_active: true, last_seen_at: new Date().toISOString() })
          .eq("id", existing.id);

        return json({
          valid: true,
          message: "Já ativado nesta máquina",
          expires_at: license.expires_at,
          email: license.user_email || email,
        });
      }

      // Check max activations
      if (license.current_activations >= license.max_activations) {
        return json({ valid: false, error: "Limite de máquinas atingido. Esta licença já está ativa em outro computador." }, 403);
      }

      // Create activation
      const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
      await supabase.from("license_activations").insert({
        license_id: license.id,
        hardware_id,
        ip_address: ip,
      });

      await supabase
        .from("licenses")
        .update({
          current_activations: license.current_activations + 1,
          hardware_id,
        })
        .eq("id", license.id);

      return json({
        valid: true,
        message: "Licença ativada com sucesso!",
        expires_at: license.expires_at,
        email: license.user_email || email,
      });
    }

    // --- HEARTBEAT ---
    if (action === "heartbeat") {
      if (!hardware_id) {
        return json({ valid: false, error: "Hardware ID obrigatório" }, 400);
      }

      // Verify email matches if provided
      if (email && license.user_email && license.user_email.toLowerCase() !== email.toLowerCase()) {
        return json({ valid: false, error: "Email não corresponde à licença" }, 403);
      }

      const { data: activation } = await supabase
        .from("license_activations")
        .select("*")
        .eq("license_id", license.id)
        .eq("hardware_id", hardware_id)
        .eq("is_active", true)
        .maybeSingle();

      if (!activation) {
        return json({ valid: false, error: "Licença não ativada nesta máquina" }, 403);
      }

      await supabase
        .from("license_activations")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", activation.id);

      await supabase
        .from("licenses")
        .update({ last_heartbeat_at: new Date().toISOString() })
        .eq("id", license.id);

      return json({
        valid: true,
        message: "Heartbeat OK",
        expires_at: license.expires_at,
      });
    }

    // --- VALIDATE (simple check — also checks email) ---
    if (email && license.user_email && license.user_email.toLowerCase() !== email.toLowerCase()) {
      return json({ valid: false, error: "Email não corresponde à licença" }, 403);
    }

    return json({
      valid: true,
      expires_at: license.expires_at,
      email: license.user_email,
    });
  } catch (err) {
    return json({ valid: false, error: String(err) }, 500);
  }
});
