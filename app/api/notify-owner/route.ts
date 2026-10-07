import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { projectId, ownerId } = await req.json();

    // Placeholder: wire up an email provider (Resend, SendGrid, SES) here.
    // It must fetch the owner's email server-side; never expose it to clients.
    console.log(`Notification queued for owner ${ownerId} (project ${projectId}).`);

    return NextResponse.json({ success: true, message: "Notification queued" });
  } catch (error: any) {
    console.error("Failed to notify owner:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
