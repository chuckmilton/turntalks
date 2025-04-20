// app/auth/signup/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import useRedirectIfAuth from "@/hooks/useRedirectIfAuth";

// extend window.google
declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize(opts: {
            client_id: string;
            callback: (resp: { credential: string }) => void;
            ux_mode?: "popup";
          }): void;
          renderButton(
            container: HTMLElement,
            opts: { theme: "outline"; size: "large" }
          ): void;
        };
      };
    };
  }
}

export default function SignupPage() {
  useRedirectIfAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // 1️⃣ Google callback
  const handleGoogleResponse = useCallback(
    async (response: { credential: string }) => {
      setErrorMessage("");
      try {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: response.credential,
        });
        if (error) throw error;
        router.push("/dashboard");
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Google signup failed");
      }
    },
    [router]
  );

  // 2️⃣ Init GSI
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(interval);
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          callback: handleGoogleResponse,
          ux_mode: "popup",
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-signup") as HTMLElement,
          { theme: "outline", size: "large" }
        );
      }
    }, 100);
    return () => clearInterval(interval);
  }, [handleGoogleResponse]);

  // 3️⃣ Email/password signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (password !== confirmPassword) {
      return setErrorMessage("Passwords do not match.");
    }
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      if (error) throw error;
      setSuccessMessage(
        "Confirmation sent—check your inbox to activate your account."
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Signup failed";
      if (msg.toLowerCase().includes("duplicate")) {
        setErrorMessage("Email already registered. Please log in.");
      } else {
        setErrorMessage(msg);
      }
    }
  };

  return (
    <>
      {/* load GSI script */}
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />

      <div className="w-full max-w-lg mx-auto my-10 p-10 bg-white shadow-lg rounded-xl">
        <h2 className="text-4xl font-bold mb-6 text-center">Sign Up</h2>

        {errorMessage && <div className="p-3 bg-red-100 text-red-600 mb-6">{errorMessage}</div>}
        {successMessage && <div className="p-3 bg-green-100 text-green-600 mb-6">{successMessage}</div>}

        {/* Google button */}
        <div id="google-signup" className="mb-6 flex justify-center"></div>

        {/* email/password */}
        <form onSubmit={handleSignup}>
          <label className="block mb-4">
            <span>Display Name</span>
            <input
              type="text"
              className="w-full border p-2 rounded mt-1"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </label>
          <label className="block mb-4">
            <span>Email</span>
            <input
              type="email"
              className="w-full border p-2 rounded mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block mb-4">
            <span>Password</span>
            <input
              type="password"
              className="w-full border p-2 rounded mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <label className="block mb-6">
            <span>Confirm Password</span>
            <input
              type="password"
              className="w-full border p-2 rounded mt-1"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </label>
          <button className="w-full py-2 bg-pink-600 text-white rounded">Sign Up</button>
        </form>

        <p className="mt-6 text-center">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-pink-600 font-bold">
            Login
          </Link>
        </p>
      </div>
    </>
  );
}
