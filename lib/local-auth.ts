/**
 * Local auth.
 *
 * Browser-only email/password accounts kept in localStorage, exposing the same
 * call shapes the app already uses (onAuthStateChanged, signOut,
 * signInWithEmailAndPassword, createUserWithEmailAndPassword,
 * sendPasswordResetEmail). Replace this file to connect a real auth provider.
 */

const USERS_KEY = "anonfeedback:users:v1";
const SESSION_KEY = "anonfeedback:session:v1";

export interface User {
  uid: string;
  email: string | null;
}

interface StoredUser {
  uid: string;
  email: string;
  passwordHash: string;
}

export interface Auth {
  currentUser: User | null;
}

export const auth: Auth = { currentUser: null };

const subscribers = new Set<(u: User | null) => void>();
const isBrowser = () => typeof window !== "undefined";

class AuthError extends Error {
  code: string;
  constructor(code: string, message?: string) {
    super(message || code);
    this.code = code;
  }
}

function readUsers(): Record<string, StoredUser> {
  if (!isBrowser()) return {};
  try {
    return JSON.parse(window.localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}
function writeUsers(users: Record<string, StoredUser>) {
  if (isBrowser()) window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

async function hash(password: string): Promise<string> {
  if (isBrowser() && window.crypto?.subtle) {
    const buf = await window.crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`anonfeedback:${password}`),
    );
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  let h = 0;
  for (let i = 0; i < password.length; i++) h = (h * 31 + password.charCodeAt(i)) | 0;
  return `fallback-${h}`;
}

function setSession(user: User | null) {
  auth.currentUser = user;
  if (isBrowser()) {
    if (user) window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else window.localStorage.removeItem(SESSION_KEY);
  }
  subscribers.forEach((cb) => cb(user));
}

function restoreSession(): User | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function validate(email: string) {
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new AuthError("auth/invalid-email");
}

export function onAuthStateChanged(
  _auth: Auth,
  cb: (user: User | null) => void,
): () => void {
  subscribers.add(cb);
  const user = restoreSession();
  auth.currentUser = user;
  const t = setTimeout(() => cb(user), 0);
  return () => {
    clearTimeout(t);
    subscribers.delete(cb);
  };
}

export async function createUserWithEmailAndPassword(
  _auth: Auth,
  email: string,
  password: string,
) {
  const key = email.trim().toLowerCase();
  validate(key);
  if (password.length < 6) throw new AuthError("auth/weak-password");
  const users = readUsers();
  if (users[key]) throw new AuthError("auth/email-already-in-use");
  const uid = `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  users[key] = { uid, email: key, passwordHash: await hash(password) };
  writeUsers(users);
  const user = { uid, email: key };
  setSession(user);
  return { user };
}

export async function signInWithEmailAndPassword(
  _auth: Auth,
  email: string,
  password: string,
) {
  const key = email.trim().toLowerCase();
  validate(key);
  const stored = readUsers()[key];
  if (!stored || stored.passwordHash !== (await hash(password))) {
    throw new AuthError("auth/invalid-credential");
  }
  const user = { uid: stored.uid, email: stored.email };
  setSession(user);
  return { user };
}

export async function sendPasswordResetEmail(_auth: Auth, email: string) {
  validate(email.trim().toLowerCase());
  // No email provider is wired up in the frontend-only build.
}

export async function signOut(_auth: Auth) {
  setSession(null);
}
