import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface User {
  login: string;
  name: string;
  avatar: string;
  licenseKey: string;
  expiresAt: string | null;
}

const STORAGE_KEY = "lovhub_license";

function generateAvatar(key: string) {
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(key)}`;
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
        verifyLicense(data.licenseKey).then((result) => {
          if (!result.valid) {
            localStorage.removeItem(STORAGE_KEY);
            setUser(null);
          }
        });
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const verifyLicense = async (key: string): Promise<{ valid: boolean; error?: string; expires_at?: string }> => {
    try {
      const resp = await supabase.functions.invoke("license-verify", {
        body: { action: "validate", license_key: key },
      });
      if (resp.error) return { valid: false, error: resp.error.message };
      return resp.data as { valid: boolean; error?: string; expires_at?: string };
    } catch (e) {
      return { valid: false, error: "Erro de conexão" };
    }
  };

  const login = useCallback(async (licenseKey: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await verifyLicense(licenseKey);

      if (!result.valid) {
        setError(result.error || "Chave de licença inválida");
        setIsLoading(false);
        return;
      }

      const userData: User = {
        login: licenseKey.slice(0, 12),
        name: `Licenciado`,
        avatar: generateAvatar(licenseKey),
        licenseKey,
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
