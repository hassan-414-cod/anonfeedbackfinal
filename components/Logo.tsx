import Link from "next/link";

export default function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 font-black tracking-tight text-lg sm:text-xl hover:opacity-80"
      aria-label="Anon-Feedback home"
    >
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="8" fill="#c6ff3d" />
        <path d="M8 13c0-3 3-5 8-5s8 2 8 5v4c0 4-3 8-8 8s-8-4-8-8v-4Z" fill="#0a0a0f" />
        <ellipse cx="12.5" cy="15" rx="2" ry="2.6" fill="#c6ff3d" />
        <ellipse cx="19.5" cy="15" rx="2" ry="2.6" fill="#c6ff3d" />
        <rect x="12" y="21" width="8" height="1.6" rx=".8" fill="#c6ff3d" />
      </svg>
      <span>
        ANON<span className="text-acid">/</span>FEEDBACK
      </span>
    </Link>
  );
}
