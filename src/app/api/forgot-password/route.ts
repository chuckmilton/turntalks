// app/api/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const {
  NEXT_PUBLIC_SUPABASE_URL: BASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_SITE_URL,    // e.g. "https://turntalks.com"
  USER_EMAIL,
  GMAIL_APP_PASSWORD,
} = process.env;

export async function POST(req: NextRequest) {
  try {
    if (!BASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !NEXT_PUBLIC_SITE_URL) {
      throw new Error("Missing Supabase or site URL config");
    }

    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1️⃣ Generate the recovery link
    const linkRes = await fetch(`${BASE_URL}/auth/v1/admin/generate_link`, {
      method: "POST",
      headers: {
        apikey:        SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type:        "recovery",
        email,
        redirect_to: `${NEXT_PUBLIC_SITE_URL}/auth/reset`,
      }),
    });

    const linkJson = await linkRes.json().catch(() => ({}));
    if (!linkRes.ok || typeof linkJson.action_link !== "string") {
      throw new Error(linkJson?.error_description || "Failed to generate reset link");
    }
    const resetLink = linkJson.action_link as string;

    // 2️⃣ Send via your SMTP transporter
    if (!USER_EMAIL || !GMAIL_APP_PASSWORD) {
      throw new Error("Missing SMTP credentials");
    }
    const transporter = nodemailer.createTransport({
      host:   "smtp.gmail.com",
      port:    465,
      secure: true,
      auth: { user: USER_EMAIL, pass: GMAIL_APP_PASSWORD },
    });
    await transporter.verify();

    await transporter.sendMail({
      from:    `TurnTalks <${USER_EMAIL}>`,
      to:       email,
      subject: "TurnTalks Password Reset",
      html: `
        <p>You requested a password reset.</p>
        <p><a href="${resetLink}">Reset your password here</a></p>
        <p>If you didn’t request this, you can ignore this email.</p>
      `,
      text: `Reset your password by visiting:\n\n${resetLink}`,
    });

    return NextResponse.json({ message: "Reset email sent" });
  } catch (err: unknown) {
    console.error("❌ forgot-password error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
