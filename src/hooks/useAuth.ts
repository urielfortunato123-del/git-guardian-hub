import { useState, useCallback } from "react";

interface User {
  login: string;
  name: string;
  avatar: string;
}

function generateAvatar(seed: string) {
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(seed)}`;
}

const defaultUser: User = {
  login: "dev",
  name: "Desenvolvedor",
  avatar: generateAvatar("dev"),
};

export function useAuth() {
  const [user] = useState<User>(defaultUser);

  const logout = useCallback(() => {
    // No-op since auth is disabled
  }, []);

  return {
    user,
    isLoading: false,
    error: null,
    logout,
  };
}
