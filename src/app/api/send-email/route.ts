// src/app/api/send-email/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";

// Ensure required environment variables are provided.
if (
  !process.env.CLIENT_ID ||
  !process.env.CLIENT_SECRET ||
  !process.env.REFRESH_TOKEN ||
  !process.env.USER_EMAIL
) {
  throw new Error("Missing environment variables for Gmail API");
}

// Create an OAuth2 client with the credentials.
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "https://developers.google.com/oauthplayground" // Replace with your actual redirect URI if needed.
);

// Set the refresh token to obtain an access token.
oauth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN,
});

// Create the Gmail API client.
const gmail = google.gmail({ version: "v1", auth: oauth2Client });

export async function POST(request: Request) {
  try {
    // Parse the request body.
    const { name, email, subject, message } = await request.json();

    // Compose email content.
    // Note: Ensure proper formatting. The email body is plain text.
    const emailContent = `
From: ${name} <${email}>
To: ${process.env.USER_EMAIL}>
Subject: ${subject}
Content-Type: text/plain; charset="UTF-8"

${message}
    `.trim();

    // Gmail API requires the email content to be base64url encoded.
    const encodedEmail = Buffer.from(emailContent)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Send the email using the Gmail API.
    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedEmail,
      },
    });

    return NextResponse.json({ success: true, data: res.data });
  } catch (err: unknown) {
    console.error("Error sending email:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
