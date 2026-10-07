import { formatDistanceToNow } from "date-fns";

export const CATEGORIES = [
  "Web App",
  "Mobile App",
  "AI Agent",
  "Website",
  "Software",
  "Design",
  "Code",
  "Video",
  "Business Idea",
  "Other",
];

export const PROJECT_TYPES = [
  { id: "link", label: "Website Link" },
  { id: "doc", label: "Document" },
  { id: "code", label: "Code Snippet" },
  { id: "image", label: "Image / Design" },
  { id: "video", label: "Video Demo" },
] as const;

export const FREE_MAX_UPLOADS = 5;
export const FREE_MAX_MB = 50;
export const PRO_MAX_MB = 500;
export const FREE_REVIEWS_PER_DAY = 15;

const ADJECTIVES = [
  "Neon", "Retro", "Lunar", "Cyber", "Cosmic", "Pixel", "Quantum", "Crypto",
  "Holo", "Astro", "Silent", "Shadow", "Hollow", "Static", "Velvet", "Rogue",
];
const NOUNS = [
  "Builder", "Crafter", "Hacker", "Coder", "Designer", "Maker", "Creator",
  "Smith", "Ninja", "Wizard", "Ghost", "Phantom", "Critic", "Fox", "Owl",
];

export function generateHandle() {
  const num = Math.floor(Math.random() * 9000) + 1000;
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj}${noun}#${num}`;
}

export function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Deterministic colour pair for a handle / id so anonymous avatars feel unique. */
export function colorsFor(seed: string) {
  const h = hashString(seed || "anon");
  const a = h % 360;
  const b = (a + 60 + (h % 80)) % 360;
  return [`hsl(${a} 85% 60%)`, `hsl(${b} 85% 55%)`] as const;
}

export function toMillis(t: any): number {
  if (!t) return 0;
  if (typeof t.toMillis === "function") return t.toMillis();
  if (typeof t.seconds === "number") return t.seconds * 1000;
  const d = new Date(t).getTime();
  return Number.isNaN(d) ? 0 : d;
}

export function timeAgo(t: any) {
  const ms = toMillis(t);
  if (!ms) return "just now";
  return `${formatDistanceToNow(new Date(ms))} ago`;
}

export function authMessage(err: any): string {
  const code: string = err?.code || "";
  const map: Record<string, string> = {
    "auth/invalid-credential": "Wrong email or password.",
    "auth/wrong-password": "Wrong email or password.",
    "auth/user-not-found": "No account found with that email.",
    "auth/email-already-in-use": "That email already has an account. Try logging in.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
    "auth/network-request-failed": "Network error. Check your connection.",
  };
  return map[code] || err?.message || "Something went wrong. Try again.";
}

export function categoryTone(category: string) {
  const tones: Record<string, string> = {
    "Web App": "text-sky-300 border-sky-400/30 bg-sky-400/10",
    "Mobile App": "text-violet-300 border-violet-400/30 bg-violet-400/10",
    "AI Agent": "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
    Website: "text-pink-300 border-pink-400/30 bg-pink-400/10",
    Software: "text-slate-300 border-slate-400/30 bg-slate-400/10",
    Design: "text-amber-300 border-amber-400/30 bg-amber-400/10",
    Code: "text-orange-300 border-orange-400/30 bg-orange-400/10",
    Video: "text-fuchsia-300 border-fuchsia-400/30 bg-fuchsia-400/10",
    "Business Idea": "text-lime-300 border-lime-400/30 bg-lime-400/10",
  };
  return tones[category] || "text-zinc-300 border-zinc-400/30 bg-zinc-400/10";
}

export const DEFAULT_ROOMS = [
  { id: "design-roast", name: "Design Roast", topic: "Design Feedback", description: "Brutally honest takes on UI, UX and visuals." },
  { id: "code-review", name: "Code Review & Architecture", topic: "Code Review", description: "Paste a snippet, get it picked apart." },
  { id: "startup-ideas", name: "Startup Ideas Validation", topic: "Startup Ideas", description: "Pitch it. Nobody knows who you are." },
  { id: "general", name: "General Chat", topic: "General Chat", description: "Anything goes. Nothing is traced." },
];

export const ROOM_TOPICS = ["Design Feedback", "Code Review", "Startup Ideas", "General Chat"];
