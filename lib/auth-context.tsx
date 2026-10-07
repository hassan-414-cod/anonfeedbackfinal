"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { User, onAuthStateChanged, signOut } from "@/lib/local-auth";
import { doc, getDoc, setDoc, serverTimestamp } from "@/lib/local-db";
import { auth } from "@/lib/local-auth";
import { db } from "@/lib/local-db";
import { generateHandle } from "./helpers";

type AuthMode = "login" | "signup";
type ToastKind = "success" | "error" | "info";

interface AuthContextType {
  user: User | null;
  userProfile: any | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  openAuth: (mode?: AuthMode) => void;
  closeAuth: () => void;
  authModal: { open: boolean; mode: AuthMode };
  toast: (message: string, kind?: ToastKind) => void;
  toasts: { id: number; message: string; kind: ToastKind }[];
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  logout: async () => {},
  refreshProfile: async () => {},
  openAuth: () => {},
  closeAuth: () => {},
  authModal: { open: false, mode: "signup" },
  toast: () => {},
  toasts: [],
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: AuthMode }>(
    { open: false, mode: "signup" },
  );
  const [toasts, setToasts] = useState<
    { id: number; message: string; kind: ToastKind }[]
  >([]);

  const toast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const loadProfile = useCallback(async (firebaseUser: User) => {
    try {
      const ref = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setUserProfile(snap.data());
      } else {
        // Self-heal: signup may have created the auth user but not the profile.
        const profile = {
          email: firebaseUser.email || "",
          anonymous_handle: generateHandle(),
          builder_score: 0,
          reviewer_score: 0,
          created_at: serverTimestamp(),
        };
        await setDoc(ref, profile);
        const fresh = await getDoc(ref);
        setUserProfile(fresh.data() || profile);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadProfile(firebaseUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (auth.currentUser) await loadProfile(auth.currentUser);
  }, [loadProfile]);

  const logout = async () => {
    await signOut(auth);
    toast("Logged out. You're a ghost again.", "info");
  };

  const openAuth = (mode: AuthMode = "signup") =>
    setAuthModal({ open: true, mode });
  const closeAuth = () => setAuthModal((m) => ({ ...m, open: false }));

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        logout,
        refreshProfile,
        openAuth,
        closeAuth,
        authModal,
        toast,
        toasts,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
