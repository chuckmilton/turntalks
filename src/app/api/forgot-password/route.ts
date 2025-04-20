// app/api/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const {
  NEXT_PUBLIC_SUPABASE_URL: BASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_SITE_URL,
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
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // 1️⃣ Generate the recovery link
    const linkRes = await fetch(
      `${BASE_URL}/auth/v1/admin/generate_link`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "recovery",
          email,
          redirectTo: `${NEXT_PUBLIC_SITE_URL}/auth/reset`,
        }),
      }
    );
    const linkJson = await linkRes.json().catch(() => ({}));
    if (!linkRes.ok || !linkJson.action_link) {
      throw new Error(
        linkJson?.error_description || "Failed to generate reset link"
      );
    }
    const resetLink: string = linkJson.action_link;

    // 2️⃣ Ensure App Password is set
    if (!USER_EMAIL || !GMAIL_APP_PASSWORD) {
      throw new Error("Missing USER_EMAIL or GMAIL_APP_PASSWORD");
    }

    // 3️⃣ Create & verify transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: USER_EMAIL, pass: GMAIL_APP_PASSWORD },
    });
    await transporter.verify();

    // 4️⃣ Send the email (no unused `info` variable)
    await transporter.sendMail({
      from: `TurnTalks <${USER_EMAIL}>`,
      to: email,
      subject: "TurnTalks Password Reset",
      text: `You requested a password reset for TurnTalks.\n\nOpen this link to reset your password:\n\n${resetLink}\n\nIf you didn’t request this, ignore it.`,
      html: `
        <p>You requested a password reset.</p>
        <p><a href="${resetLink}">Reset your password here</a></p>
        <p>If you didn’t request this, you can ignore this email.</p>
      `,
    });

    return NextResponse.json({ message: "Reset email sent" });
  } catch (err: unknown) {
    console.error("forgot-password error:", err);
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
