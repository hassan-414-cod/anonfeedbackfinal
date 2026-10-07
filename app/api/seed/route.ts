import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase'; // Actually I can't easily use client SDK in edge runtime or some server environments for batch, but normal node backend can use it.
import { doc, setDoc, writeBatch, collection } from 'firebase/firestore';

export async function POST() {
  try {
    // Generate dummy projects
    const batch = writeBatch(db);

    const seedUsers = [
      { id: "seed_u1", handle: "PixelNinja#1024", email: "1@test.com" },
      { id: "seed_u2", handle: "AstroBuilder#9912", email: "2@test.com" },
      { id: "seed_u3", handle: "CyberCrafter#4040", email: "3@test.com" },
      { id: "seed_u4", handle: "NeonMaker#1111", email: "4@test.com" }
    ];

    for (const u of seedUsers) {
      batch.set(doc(db, "users", u.id), {
        email: u.email,
        anonymous_handle: u.handle,
        builder_score: 15,
        reviewer_score: 5,
        created_at: new Date()
      });
    }

    const projects = [
      {
        id: "p1",
        owner_user_id: "seed_u1",
        owner_handle: "PixelNinja#1024",
        title: "DrawnToLife - Minimalist sketch app",
        category: "Web App",
        description: "A fast, browser-based drawing tool with no menus. Just you and the canvas. I'm struggling with the color picker UI, would love thoughts on how to make it feel less cluttered.",
        link_or_file_url: "https://example.com/draw",
        cover_image_url: "https://picsum.photos/seed/p1/800/400",
        upvotes: 12,
        downvotes: 2,
        created_at: new Date(Date.now() - 1000000)
      },
      {
        id: "p2",
        owner_user_id: "seed_u2",
        owner_handle: "AstroBuilder#9912",
        title: "FocusFlow Mobile",
        category: "Mobile App",
        description: "Pomodoro timer that grows a virtual tree. The animations are built in React Native. Is the gamification too much, or just right?",
        link_or_file_url: "https://example.com/focus",
        cover_image_url: "https://picsum.photos/seed/p2/800/400",
        upvotes: 45,
        downvotes: 1,
        created_at: new Date(Date.now() - 5000000)
      },
      {
        id: "p3",
        owner_user_id: "seed_u3",
        owner_handle: "CyberCrafter#4040",
        title: "SaaS Boilerplate for Solo Founders",
        category: "Code",
        description: "Postgres + NextJS + Stripe in one line. Need feedback on the documentation layout specifically.",
        link_or_file_url: "https://github.com/example/repo",
        cover_image_url: "https://picsum.photos/seed/p3/800/400",
        upvotes: 8,
        downvotes: 4,
        created_at: new Date(Date.now() - 2000000)
      },
      {
        id: "p4",
        owner_user_id: "seed_u4",
        owner_handle: "NeonMaker#1111",
        title: "Matcha - AI meeting notes",
        category: "Business Idea",
        description: "Not another AI meeting tool, this one explicitly connects to your CRM to update deals based on transcript intent. Roast the landing page copy please.",
        link_or_file_url: "https://example.com/matcha",
        cover_image_url: "https://picsum.photos/seed/p4/800/400",
        upvotes: 2,
        downvotes: 1,
        created_at: new Date(Date.now() - 150000)
      },
      {
        id: "p5",
        owner_user_id: "seed_u3",
        owner_handle: "CyberCrafter#4040",
        title: "Dark Mode Dashboard UI Kit",
        category: "Design",
        description: "Figma file with 50+ charts and widgets designed for deep dark mode. Too blue? Not blue enough?",
        link_or_file_url: "https://figma.com/example",
        cover_image_url: "https://picsum.photos/seed/p5/800/400",
        upvotes: 33,
        downvotes: 0,
        created_at: new Date(Date.now() - 8000000)
      }
    ];

    for (const p of projects) {
       batch.set(doc(db, "projects", p.id), p);
    }

    const feedbacks = [
      {
        id: "p1_seed_u2", // user 2 reviews project 1
        project_id: "p1",
        reviewer_user_id: "seed_u2",
        reviewer_handle: "AstroBuilder#9912",
        vote: "up",
        whats_good: "The canvas response time is insane! Super smooth.",
        whats_improvable: "The color picker taking up 20% of the screen horizontally feels distracting.",
        suggested_next_step: "Try moving the color picker into a floating action button that expands on hover.",
        has_text: true,
        marked_helpful: true,
        created_at: new Date()
      },
      {
        id: "p3_seed_u1",
        project_id: "p3",
        reviewer_user_id: "seed_u1",
        reviewer_handle: "PixelNinja#1024",
        vote: "down",
        whats_good: "The tech stack choice is solid for sure.",
        whats_improvable: "Your docs assume I already know how to configure Stripe webhooks. I got stuck on step 2.",
        suggested_next_step: "Add a 2-minute loom video explaining the Stripe webhook setup step-by-step.",
        has_text: true,
        marked_helpful: false,
        created_at: new Date()
      }
    ];

    for (const f of feedbacks) {
       batch.set(doc(db, "feedback", f.id), f);
    }

    await batch.commit();

    return NextResponse.json({ success: true, message: "Seeded" });
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
