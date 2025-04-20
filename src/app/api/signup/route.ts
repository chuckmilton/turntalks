// app/api/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const BASE_URL             = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY     = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SITE_URL             = process.env.NEXT_PUBLIC_SITE_URL!;
const SMTP_USER            = process.env.USER_EMAIL!;
const SMTP_PASS            = process.env.GMAIL_APP_PASSWORD!;

export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName } = await req.json();
    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: "email, password and displayName are all required" },
        { status: 400 }
      );
    }

    // 1️⃣ Create the user without sending Supabase’s built‑in email
    const createRes = await fetch(`${BASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        apikey:        SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        user_metadata: { display_name: displayName },
      }),
    });
    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err.message || "Failed to create user");
    }

    // 2️⃣ Generate a signup confirmation link
    const linkRes = await fetch(`${BASE_URL}/auth/v1/admin/generate_link`, {
      method: "POST",
      headers: {
        apikey:        SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type:        "signup",
        email,
        redirect_to: `${SITE_URL}/auth/confirm`,
      }),
    });
    const linkJson = await linkRes.json().catch(() => ({}));
    if (!linkRes.ok || typeof linkJson.action_link !== "string") {
      throw new Error(
        linkJson.error_description || "Failed to generate signup link"
      );
    }
    const confirmLink: string = linkJson.action_link;

    // 3️⃣ Send it via your Gmail SMTP
    const transporter = nodemailer.createTransport({
      host:   "smtp.gmail.com",
      port:    465,
      secure: true,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transporter.verify();

    await transporter.sendMail({
      from:    `TurnTalks <${SMTP_USER}>`,
      to:       email,
      subject: "TurnTalks: Confirm your email",
      html: `
        <h2>Welcome to TurnTalks, ${displayName}!</h2>
        <p>Please click the link below to activate your account:</p>
        <p><a href="${confirmLink}">Confirm my email</a></p>
        <p>If you didn’t sign up, you can ignore this email.</p>
      `,
      text: `Hello ${displayName}, confirm your account here:\n\n${confirmLink}`,
    });

    return NextResponse.json({ message: "Confirmation email sent" });
  } catch (err: unknown) {
    console.error("signup error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
