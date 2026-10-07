import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Language, User } from "@/types";
import * as authService from "@/services/authService";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signup: (payload: authService.SignupPayload) => Promise<void>;
  login: (payload: authService.LoginPayload) => Promise<void>;
  logout: () => void;
  updatePreferredLanguage: (language: Language) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(authService.getStoredUser());
    setIsLoading(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      signup: async (payload) => {
        const newUser = await authService.signup(payload);
        setUser(newUser);
      },
      login: async (payload) => {
        const loggedInUser = await authService.login(payload);
        setUser(loggedInUser);
      },
      logout: () => {
        authService.logout();
        setUser(null);
      },
      updatePreferredLanguage: (language) => {
        const updated = authService.updateStoredUser({ preferredLanguage: language });
        if (updated) setUser(updated);
      },
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
