import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface User {
  login: string;
  name: string;
  avatar: string;
  email: string;
  licenseKey: string;
  expiresAt: string | null;
}

type AuthStep = "login" | "activate" | "register";

function generateAvatar(seed: string) {
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(seed)}`;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<AuthStep>("login");

  // Pending activation data (used between activate → register steps)
  const [pendingActivation, setPendingActivation] = useState<{
    licenseKey: string;
    email: string;
    expiresAt: string | null;
  } | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Fetch profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (profile) {
            setUser({
              login: profile.display_name || profile.email.split("@")[0],
              name: profile.display_name || profile.email.split("@")[0],
              avatar: generateAvatar(profile.email),
              email: profile.email,
              licenseKey: profile.license_key,
              expiresAt: null,
            });
            setStep("login");
          } else {
            // Authenticated but no profile — shouldn't happen normally
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Step 1: Activate license (first time only)
  const activateLicense = useCallback(async (licenseKey: string, email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const resp = await supabase.functions.invoke("license-verify", {
        body: { action: "validate", license_key: licenseKey, email },
      });

      if (resp.error) {
        setError(resp.error.message);
        setIsLoading(false);
        return;
      }

      const data = resp.data as { valid: boolean; error?: string; expires_at?: string };

      if (!data.valid) {
        setError(data.error || "Chave ou email inválido");
        setIsLoading(false);
        return;
      }

      // License valid — move to register step
      setPendingActivation({
        licenseKey,
        email,
        expiresAt: data.expires_at || null,
      });
      setStep("register");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Step 2: Create account (email + password)
  const register = useCallback(async (password: string, displayName: string) => {
    if (!pendingActivation) {
      setError("Ative a licença primeiro.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { email, licenseKey } = pendingActivation;

      // Create Supabase auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });

      if (signUpError) {
        // If user already exists, try login
        if (signUpError.message.includes("already registered")) {
          setError("Este email já tem conta. Faça login com sua senha.");
          setStep("login");
          setIsLoading(false);
          return;
        }
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Erro ao criar conta.");
        setIsLoading(false);
        return;
      }

      // Lookup license ID
      const { data: licenseData } = await supabase
        .from("licenses")
        .select("id")
        .eq("license_key", licenseKey)
        .maybeSingle();

      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: authData.user.id,
        email,
        display_name: displayName || email.split("@")[0],
        license_key: licenseKey,
        license_id: licenseData?.id || null,
      });

      if (profileError) {
        console.error("Profile creation error:", profileError);
      }

      setPendingActivation(null);
      // Auth state change listener will handle setting user
    } catch {
      setError("Erro ao criar conta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, [pendingActivation]);

  // Login with email + password
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message === "Invalid login credentials" 
          ? "Email ou senha incorretos" 
          : signInError.message);
      }
      // Auth state change listener will handle setting user
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setError(null);
    setStep("login");
    setPendingActivation(null);
  }, []);

  const switchToActivate = useCallback(() => {
    setStep("activate");
    setError(null);
  }, []);

  const switchToLogin = useCallback(() => {
    setStep("login");
    setError(null);
  }, []);

  return {
    user,
    isLoading,
    error,
    step,
    pendingActivation,
    activateLicense,
    register,
    login,
    logout,
    switchToActivate,
    switchToLogin,
  };
}
