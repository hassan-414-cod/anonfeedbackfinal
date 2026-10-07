import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const { projectId, ownerId } = await req.json();
    
    // In a real app, you would:
    // 1. Fetch owner details from Firestore to get their email address.
    // 2. Use a service like Resend, SendGrid, or AWS SES to send the email.
    // Example:
    // const ownerDoc = await getDoc(doc(db, "users", ownerId));
    // const email = ownerDoc.data()?.email;
    // await resend.emails.send({ to: email, subject: 'New Feedback!', html: '...' });

    console.log(`Mock: Email notification would be sent to owner ${ownerId} for project ${projectId}.`);

    return NextResponse.json({ success: true, message: "Notification queued" });
  } catch (error: any) {
    console.error("Failed to notify owner:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
