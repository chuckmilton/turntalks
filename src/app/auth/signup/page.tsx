"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import useRedirectIfAuth from "@/hooks/useRedirectIfAuth";

// extend window.google typing
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
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const [errorMessage, setError]    = useState("");
  const [successMessage, setSuccess] = useState("");

  // 1️⃣ Google callback
  const handleGoogleResponse = useCallback(
    async (response: { credential: string }) => {
      setError("");
      try {
        // This will sign in or sign up via the ID token
        const { error } = await import("@/lib/supabaseClient")
          .then(({ supabase }) =>
            supabase.auth.signInWithIdToken({
              provider: "google",
              token: response.credential,
            })
          );
        if (error) throw error;
        router.push("/dashboard");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Google signup failed";
        setError(msg);
      }
    },
    [router]
  );

  // Init GSI once
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

  // Email/password signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || res.statusText);
      setSuccess("Confirmation sent—check your inbox.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Signup failed";
      setError(
        msg.toLowerCase().includes("duplicate")
          ? "Email already registered. Please log in instead."
          : msg
      );
    }
  };

  return (
    <>
      {/* Load Google Identity Services */}
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />

      <div className="w-full max-w-lg mx-auto my-10 p-10 bg-white shadow-lg rounded-xl animate-fadeInUp">
        <h2 className="text-4xl font-bold mb-6 text-center text-gray-800">Sign Up</h2>

        {errorMessage && (
          <div className="mb-6 p-3 bg-red-100 text-red-600 border border-red-200 rounded">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-3 bg-green-100 text-green-600 border border-green-200 rounded">
            {successMessage}
          </div>
        )}

        {/* Google Sign‑Up Button */}
        <div id="google-signup" className="mb-6 flex justify-center" />

        {/* Email/Password Form */}
        {!successMessage && (
          <form onSubmit={handleSignup}>
            <label className="block mb-4">
              <span className="block text-gray-700 font-semibold mb-1">Display Name:</span>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-pink-500"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </label>
            <label className="block mb-4">
              <span className="block text-gray-700 font-semibold mb-1">Email:</span>
              <input
                type="email"
                className="w-full border border-gray-300 rounded-md p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-pink-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="block mb-4">
              <span className="block text-gray-700 font-semibold mb-1">Password:</span>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-md p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-pink-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <label className="block mb-6">
              <span className="block text-gray-700 font-semibold mb-1">Confirm Password:</span>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-md p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-pink-500"
                value={confirmPassword}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </label>
            <button
              type="submit"
              className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
            >
              Sign Up
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-pink-600 hover:text-pink-700 font-bold">
            Login
          </Link>
        </p>
      </div>
    </>
  );
}
