import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface User {
  login: string;
  name: string;
  avatar: string;
  licenseKey: string;
  email: string;
  expiresAt: string | null;
}

const STORAGE_KEY = "lovhub_license";

function generateAvatar(seed: string) {
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(seed)}`;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setUser(data);
        // Verify in background
        callServer("validate", data.licenseKey, data.email).then((result) => {
          if (result.valid === false) {
            localStorage.removeItem(STORAGE_KEY);
            setUser(null);
          }
        });
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const callServer = async (
    action: string,
    licenseKey: string,
    email?: string,
    hardwareId?: string
  ): Promise<{ valid: boolean; error?: string; expires_at?: string; email?: string }> => {
    try {
      const resp = await supabase.functions.invoke("license-verify", {
        body: { action, license_key: licenseKey, email, hardware_id: hardwareId },
      });
      if (resp.error) return { valid: false, error: resp.error.message };
      return resp.data as { valid: boolean; error?: string; expires_at?: string; email?: string };
    } catch {
      return { valid: false, error: "Erro de conexão com o servidor" };
    }
  };

  const login = useCallback(async (licenseKey: string, email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate key + email match
      const result = await callServer("validate", licenseKey, email);

      if (result.valid === false) {
        setError(result.error || "Chave de licença ou email inválido");
        setIsLoading(false);
        return;
      }

      const userData: User = {
        login: licenseKey.slice(0, 12),
        name: email.split("@")[0],
        avatar: generateAvatar(email),
        licenseKey,
        email,
        expiresAt: result.expires_at || null,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
    } catch {
      setError("Erro ao verificar licença. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setError(null);
  }, []);

  return { user, isLoading, error, login, logout };
}
