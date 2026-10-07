import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-grow flex flex-col items-center justify-center text-center px-4 py-24">
      <div className="mono text-8xl font-black text-acid mb-2">404</div>
      <h1 className="text-2xl font-black mb-2">This page was <span className="redacted px-1">redacted</span>.</h1>
      <p className="text-fog mb-8">It never existed. Probably.</p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link href="/" className="btn btn-acid">Go home</Link>
        <Link href="/feed" className="btn btn-ghost">Browse the feed</Link>
      </div>
    </div>
  );
}
