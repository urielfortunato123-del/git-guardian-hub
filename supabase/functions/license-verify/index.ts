import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, license_key, hardware_id } = await req.json();

    if (!license_key) {
      return new Response(JSON.stringify({ valid: false, error: "Missing license_key" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Lookup license
    const { data: license, error: lookupErr } = await supabase
      .from("licenses")
      .select("*")
      .eq("license_key", license_key)
      .maybeSingle();

    if (lookupErr || !license) {
      return new Response(JSON.stringify({ valid: false, error: "Invalid license key" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!license.is_active) {
      return new Response(JSON.stringify({ valid: false, error: "License revoked" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return new Response(JSON.stringify({ valid: false, error: "License expired" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- ACTIVATE ---
    if (action === "activate") {
      if (!hardware_id) {
        return new Response(JSON.stringify({ valid: false, error: "Missing hardware_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check existing activation for this hardware
      const { data: existing } = await supabase
        .from("license_activations")
        .select("*")
        .eq("license_id", license.id)
        .eq("hardware_id", hardware_id)
        .maybeSingle();

      if (existing) {
        // Re-activate
        await supabase
          .from("license_activations")
          .update({ is_active: true, last_seen_at: new Date().toISOString() })
          .eq("id", existing.id);

        return new Response(JSON.stringify({ valid: true, message: "Already activated" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check max activations
      if (license.current_activations >= license.max_activations) {
        return new Response(JSON.stringify({ valid: false, error: "Max activations reached" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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
        .update({ current_activations: license.current_activations + 1 })
        .eq("id", license.id);

      return new Response(JSON.stringify({ valid: true, message: "Activated successfully" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- HEARTBEAT ---
    if (action === "heartbeat") {
      if (!hardware_id) {
        return new Response(JSON.stringify({ valid: false, error: "Missing hardware_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: activation } = await supabase
        .from("license_activations")
        .select("*")
        .eq("license_id", license.id)
        .eq("hardware_id", hardware_id)
        .eq("is_active", true)
        .maybeSingle();

      if (!activation) {
        return new Response(JSON.stringify({ valid: false, error: "Not activated on this machine" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase
        .from("license_activations")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", activation.id);

      await supabase
        .from("licenses")
        .update({ last_heartbeat_at: new Date().toISOString() })
        .eq("id", license.id);

      return new Response(JSON.stringify({ valid: true, message: "Heartbeat OK" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- VALIDATE (simple check) ---
    return new Response(JSON.stringify({ valid: true, expires_at: license.expires_at }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ valid: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
