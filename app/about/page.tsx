import Link from "next/link";
import { EyeOff, Lock, MessageSquare, ShieldCheck, Star, Upload } from "lucide-react";

const POINTS = [
  { icon: EyeOff, title: "Anonymous by default", text: "You get a random handle like NeonGhost#4821. Nobody sees your email or name, and you can burn the handle any time from your profile." },
  { icon: Upload, title: "Upload anything", text: "Links, documents, code, images or video. For files you choose whether people can download, only view, or not see the file at all." },
  { icon: Star, title: "Structured feedback", text: "Reviewers vote, then optionally say what is good, what needs fixing and a next step. Owners mark the useful ones as helpful." },
  { icon: MessageSquare, title: "Live chat rooms", text: "Drop into design, code and startup rooms or create your own. Everyone is a mask." },
  { icon: ShieldCheck, title: "Report abuse", text: "Every project and review can be reported, so the community stays useful instead of toxic." },
  { icon: Lock, title: "Why email at all?", text: "Only to stop spam and let you recover your account. It is never displayed on the site." },
];

const FAQ = [
  { q: "Is feedback really anonymous?", a: "Yes. Reviews, projects and chat messages only ever show your generated handle." },
  { q: "How does the leaderboard work?", a: "Builders earn a point for each upvote on their projects. Reviewers earn a point each time an owner marks their feedback helpful." },
  { q: "What are the free limits?", a: "5 projects, 50MB per file and 15 reviews per 24 hours. Pro lifts all of them." },
];

export default function AboutPage() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 flex-grow">
      <div className="chip mb-4"><span className="live-dot" /> how it works</div>
      <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight mb-4">
        Honest feedback needs <span className="text-acid">no names.</span>
      </h1>
      <p className="text-fog text-lg max-w-2xl mb-12">
        Friends are polite and followers are biased. Strangers wearing masks tell you what they actually think.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
        {POINTS.map((p) => (
          <div key={p.title} className="card p-6">
            <p.icon className="w-6 h-6 text-acid mb-4" />
            <h2 className="font-bold text-lg mb-1">{p.title}</h2>
            <p className="text-sm text-fog">{p.text}</p>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-black mb-5">FAQ</h2>
      <div className="space-y-3 mb-12">
        {FAQ.map((f) => (
          <details key={f.q} className="card p-5 group">
            <summary className="font-bold cursor-pointer list-none flex justify-between gap-4">
              {f.q} <span className="text-acid group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="text-fog text-sm mt-3">{f.a}</p>
          </details>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/projects?tab=new" className="btn btn-acid">Upload a project</Link>
        <Link href="/feed" className="btn btn-ghost">Browse the feed</Link>
        <Link href="/billing" className="btn btn-ghost">See plans</Link>
      </div>
    </div>
  );
}
