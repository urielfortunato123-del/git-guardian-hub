import { useState, useCallback } from "react";

interface User {
  login: string;
  name: string;
  avatar: string;
}

const MOCK_USER: User = {
  login: "devhacker",
  name: "Dev Hacker",
  avatar: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=lovhub",
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(() => {
    setIsLoading(true);
    // Mock login - in production this would redirect to GitHub OAuth
    setTimeout(() => {
      setUser(MOCK_USER);
      setIsLoading(false);
    }, 800);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return { user, isLoading, login, logout };
}
