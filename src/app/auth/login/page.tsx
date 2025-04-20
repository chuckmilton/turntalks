// app/auth/login/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import useRedirectIfAuth from "@/hooks/useRedirectIfAuth";

// tell TS about window.google
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

export default function LoginPage() {
  useRedirectIfAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [resetMessage, setResetMessage] = useState("");

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
        setErrorMessage(err instanceof Error ? err.message : "Google login failed");
      }
    },
    [router]
  );

  // 2️⃣ Load & then init the GSI button
  useEffect(() => {
    // wait for GSI script to have injected `window.google`
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(interval);
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          callback: handleGoogleResponse,
          ux_mode: "popup",
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-signin") as HTMLElement,
          { theme: "outline", size: "large" }
        );
      }
    }, 100);

    return () => clearInterval(interval);
  }, [handleGoogleResponse]);

  // 3️⃣ Email/password login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setResetMessage("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/dashboard");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Login failed");
    }
  };

  // 4️⃣ Forgot password
  const handleForgotPassword = async () => {
    setErrorMessage("");
    setResetMessage("");
    if (!email) return setErrorMessage("Please enter your email.");
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || res.statusText);
      setResetMessage("Reset link sent! Check your inbox.");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Request failed");
    }
  };

  return (
    <>
      {/*  Load the GSI script once */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
      />

      <div className="w-full max-w-lg mx-auto my-10 p-10 bg-white shadow-lg rounded-xl animate-fadeInUp">
        <h2 className="text-4xl font-bold mb-6 text-center">Login</h2>

        {errorMessage && (
          <div className="mb-6 p-3 bg-red-100 text-red-600 rounded">{errorMessage}</div>
        )}
        {resetMessage && (
          <div className="mb-6 p-3 bg-green-100 text-green-600 rounded">{resetMessage}</div>
        )}

        {/* Google button */}
        <div id="google-signin" className="mb-6 flex justify-center" />

        {/* Email/password */}
        <form onSubmit={handleLogin}>
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
          <label className="block mb-6">
            <span>Password</span>
            <input
              type="password"
              className="w-full border p-2 rounded mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button className="w-full py-2 bg-pink-600 text-white rounded">
            Login
          </button>
        </form>

        <p className="mt-4 text-center">
          <button onClick={handleForgotPassword} className="text-pink-600">
            Forgot Password?
          </button>
        </p>

        <p className="mt-6 text-center">
          Don’t have an account?{" "}
          <Link href="/auth/signup" className="text-pink-600 font-bold">
            Sign Up
          </Link>
        </p>
      </div>
    </>
  );
}
