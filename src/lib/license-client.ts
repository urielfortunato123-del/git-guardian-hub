/**
 * License Client - Validates, activates and maintains license via edge function.
 */
import { supabase } from "@/integrations/supabase/client";

interface LicenseResult {
  valid: boolean;
  error?: string;
  message?: string;
  expires_at?: string | null;
  email?: string;
  plan_type?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  expired: boolean;
  message: string;
}

const LICENSE_CLIENT_KEY = "lck_a7f3e9b2d1c8045f6e7a9b3c2d1e0f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0";

async function callLicenseVerify(body: Record<string, unknown>): Promise<LicenseResult> {
  const { data, error } = await supabase.functions.invoke("license-verify", {
    body,
    headers: { "x-license-client-key": LICENSE_CLIENT_KEY },
  });
  if (error) return { valid: false, error: error.message };
  return data as LicenseResult;
}

/**
 * Full license check: validate → activate (if hardware available) → start heartbeat.
 */
export async function checkLicense(licenseKey: string, email?: string): Promise<LicenseResult> {
  // Step 1: Validate
  const validateResult = await callLicenseVerify({
    action: "validate",
    license_key: licenseKey,
    ...(email && { email }),
  });

  if (!validateResult.valid) return validateResult;

  // Step 2: Try to activate with hardware ID (browser fingerprint)
  const hardwareId = await getBrowserHardwareId();
  if (hardwareId) {
    const activateResult = await callLicenseVerify({
      action: "activate",
      license_key: licenseKey,
      hardware_id: hardwareId,
      email: email || validateResult.email || "",
    });

    if (!activateResult.valid) return activateResult;

    // Step 3: Start periodic heartbeat
    startHeartbeat(licenseKey, hardwareId);

    return { ...activateResult, plan_type: derivePlanType(activateResult) };
  }

  return { ...validateResult, plan_type: derivePlanType(validateResult) };
}

/**
 * Calculate time remaining until expiration.
 */
export function getTimeRemaining(expiresAt: string): TimeRemaining {
  const now = new Date().getTime();
  const exp = new Date(expiresAt).getTime();
  const diff = exp - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, expired: true, message: "Licença expirada" };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  let message = "";
  if (days > 0) message = `${days} dia(s) e ${hours}h`;
  else if (hours > 0) message = `${hours}h e ${minutes}min`;
  else message = `${minutes} minuto(s)`;

  return { days, hours, minutes, expired: false, message };
}

// --- Internal helpers ---

async function getBrowserHardwareId(): Promise<string | null> {
  try {
    const parts = [
      navigator.userAgent,
      navigator.language,
      screen.width + "x" + screen.height,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ];
    const raw = parts.join("|");
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(raw));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
  } catch {
    return null;
  }
}

function derivePlanType(result: LicenseResult): string {
  return result.plan_type || "standard";
}

let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

function startHeartbeat(licenseKey: string, hardwareId: string) {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(() => {
    callLicenseVerify({
      action: "heartbeat",
      license_key: licenseKey,
      hardware_id: hardwareId,
    }).catch(() => {});
  }, 60 * 60 * 1000); // 1 hour
}
