import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-line mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <div className="lg:col-span-2">
          <Logo />
          <p className="text-fog mt-3 max-w-sm">
            Honest feedback needs anonymity. Share your work, get unfiltered
            critique, never reveal who you are.
          </p>
        </div>
        <div>
          <div className="label">Explore</div>
          <ul className="space-y-2">
            <li><Link href="/feed" className="hover:text-acid">Feed</Link></li>
            <li><Link href="/rooms" className="hover:text-acid">Chat rooms</Link></li>
            <li><Link href="/leaderboard" className="hover:text-acid">Leaderboard</Link></li>
          </ul>
        </div>
        <div>
          <div className="label">Account</div>
          <ul className="space-y-2">
            <li><Link href="/projects?tab=new" className="hover:text-acid">Upload a project</Link></li>
            <li><Link href="/profile" className="hover:text-acid">Profile</Link></li>
            <li><Link href="/billing" className="hover:text-acid">Plans</Link></li>
            <li><Link href="/about" className="hover:text-acid">How it works</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center mono text-[11px] text-fog">
        no names · no photos · just the work
      </div>
    </footer>
  );
}
