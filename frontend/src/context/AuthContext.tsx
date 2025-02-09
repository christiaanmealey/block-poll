import { useContext, createContext, useState, ReactNode } from "react";
import useAuthUtils from "../hooks/useAuthUtils";

interface AuthContextType {
  isAuthenticated: boolean;
  user: any[] | null;
  token: string | null;
  login: (email: string) => void;
  register: (email: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any[] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const {
    signChallenge,
    generateKeyPair,
    savePrivateKeyToLocalStorage,
    loadPrivateKeyFromLocalStorage,
  } = useAuthUtils();

  const login = async (email: string | undefined) => {
    const privateKey = await loadPrivateKeyFromLocalStorage();
    if (!privateKey) {
      return alert("No private key, please register first");
    }
    const challenge = await requestChallenge(email);
    const signedChallenge = await signChallenge(privateKey, challenge);
    const verified = await verifyChallenge(email, signedChallenge);
    return verified;
  };

  const register = async (email: string | undefined) => {
    const { publicKeyPem, privateKeyPem } = await generateKeyPair();
    await savePrivateKeyToLocalStorage(privateKeyPem);

    const response = await fetch("http://localhost:5000/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, publicKey: publicKeyPem }),
    });

    const result = await response.json();
    localStorage.setItem("publicKey", result.publicKey);
    return result;
  };

  const requestChallenge = async (email: string | undefined) => {
    const response = await fetch("http://localhost:5000/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const result = await response.json();
    return result.challenge;
  };

  const verifyChallenge = async (
    email: string | undefined,
    signedChallenge: string
  ) => {
    const response = await fetch("http://localhost:5000/users/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, signedChallenge }),
    });
    const result = await response.json();

    if (result.token) {
      setToken(result.token);
      setIsAuthenticated(true);
      setUser(result.user);
      localStorage.setItem("token", result.token);
    } else {
      console.log("Verification failed");
    }
    return result;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
