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
  const { signChallenge } = useAuthUtils();
  
  const login = async (email: string | undefined) => {
    if (!localStorage.getItem("privateKey")) {
      return alert("no private key, please register first");
    }
    const privateKey = localStorage.getItem("privateKey");
    const challenge = await requestChallenge(email);
    const signedChallenge = await signChallenge(privateKey, challenge);
    console.log(signedChallenge);
    const verified = await verifyChallenge(email, signedChallenge);
    return verified;
  };

  const register = async (email: string | undefined) => {
    const { publicKeyPem } = await generateKeyPair();
    const response = await fetch("http://localhost:5000/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, publicKey: publicKeyPem }),
    });
    const result = await response.json();
    console.log("publicKey", result.publicKey);
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
      console.log("verification failed");
    }
    return result;
  };

  const generateKeyPair = async () => {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"]
    );

    const exportedPublicKey = await window.crypto.subtle.exportKey(
      "spki",
      keyPair.publicKey
    );

    const publicKeyPem = btoa(
      String.fromCharCode(...new Uint8Array(exportedPublicKey))
    );

    const exportedPrivateKey = await window.crypto.subtle.exportKey(
      "pkcs8",
      keyPair.privateKey
    );

    const privateKeyPem = btoa(
      String.fromCharCode(...new Uint8Array(exportedPrivateKey))
    );

    localStorage.setItem(
      "publickKey",
      btoa(String.fromCharCode(...new Uint8Array(exportedPublicKey)))
    );
    localStorage.setItem(
      "privateKey",
      btoa(String.fromCharCode(...new Uint8Array(exportedPrivateKey)))
    );

    return { publicKeyPem, privateKeyPem };
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
