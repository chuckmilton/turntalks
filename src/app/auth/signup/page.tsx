"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import useRedirectIfAuth from "@/hooks/useRedirectIfAuth";

// Tell TypeScript about window.google
declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize(opts: {
            client_id: string;
            callback: (response: { credential: string }) => void;
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

  // 1️⃣ Memoized Google callback
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
        const msg = err instanceof Error ? err.message : "Unexpected error";
        setErrorMessage(msg);
      }
    },
    [router]
  );

  // 2️⃣ AfterInteractive script to init GSI
  //    & render button into #google-signup
  //    no need for useEffect
  //    you can optionally call this in onLoad
  //    if you want to re-render on every mount.
  useEffect(() => {
    // nothing here anymore
  }, []);

  // 3️⃣ Email/password sign‑up
  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      if (error) throw error;
      setSuccessMessage(
        "A confirmation email has been sent. Please check your inbox to activate your account."
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unexpected error";
      if (
        msg.toLowerCase().includes("duplicate") ||
        msg.toLowerCase().includes("already registered")
      ) {
        setErrorMessage("This email is already registered. Please log in instead.");
      } else {
        setErrorMessage(msg);
      }
    }
  };

  return (
    <>
      {/* load the GSI script once */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          const g = window.google;
          if (g?.accounts?.id) {
            g.accounts.id.initialize({
              client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
              callback: handleGoogleResponse,
            });
            g.accounts.id.renderButton(
              document.getElementById("google-signup") as HTMLElement,
              { theme: "outline", size: "large" }
            );
          }
        }}
      />

      <div className="w-full max-w-lg mx-auto my-10 p-10 bg-white shadow-lg rounded-xl animate-fadeInUp">
        <h2 className="text-4xl font-bold mb-6 text-center text-gray-800">Sign Up</h2>

        {!!errorMessage && (
          <div className="mb-6 p-3 bg-red-100 text-red-600 border border-red-200 rounded">
            {errorMessage}
          </div>
        )}
        {!!successMessage && (
          <div className="mb-6 p-3 bg-green-100 text-green-600 border border-green-200 rounded">
            {successMessage}
          </div>
        )}

        {/* Google Sign‑Up placeholder */}
        <div id="google-signup" className="mb-6 flex justify-center" />

        {/* Email/Password Form */}
        {!successMessage && (
          <form onSubmit={handleSignup}>
            <label className="block mb-4">
              <span className="block text-gray-700 font-semibold mb-1">Display Name:</span>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </label>

            <label className="block mb-4">
              <span className="block text-gray-700 font-semibold mb-1">Email:</span>
              <input
                type="email"
                className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="block mb-4">
              <span className="block text-gray-700 font-semibold mb-1">Password:</span>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            <label className="block mb-6">
              <span className="block text-gray-700 font-semibold mb-1">Confirm Password:</span>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
          Already have an account?{" "}
          <Link href="/auth/login" className="text-pink-600 hover:text-pink-700 font-bold">
            Login
          </Link>
        </p>
      </div>
    </>
  );
}
