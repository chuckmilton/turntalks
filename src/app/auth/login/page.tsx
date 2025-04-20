// app/auth/login/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Head from "next/head";
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

export default function LoginPage() {
  useRedirectIfAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  // memoized Google callback
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
        const msg = err instanceof Error ? err.message : "An unexpected error occurred";
        setErrorMessage(msg);
      }
    },
    [router]
  );

  // Google Identity Services
  useEffect(() => {
    const g = typeof window !== "undefined" ? window.google : undefined;
    if (g?.accounts?.id) {
      g.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        callback: handleGoogleResponse,
      });
      g.accounts.id.renderButton(
        document.getElementById("google-signin") as HTMLElement,
        { theme: "outline", size: "large" }
      );
    }
  }, [handleGoogleResponse]);

  // standard email/password login
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setResetMessage("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setErrorMessage(msg);
    }
  };

  // forgot password
  const handleForgotPassword = async () => {
    setErrorMessage("");
    setResetMessage("");
    if (!email) {
      setErrorMessage("Please enter your email to reset your password.");
      return;
    }
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
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setErrorMessage(msg);
    }
  };

  return (
    <>
      <Head>
        <script src="https://accounts.google.com/gsi/client" async defer />
      </Head>
      <div className="w-full max-w-lg mx-auto my-10 p-10 bg-white shadow-lg rounded-xl animate-fadeInUp">
        <h2 className="text-4xl font-bold mb-6 text-center text-gray-800">Login</h2>

        {!!errorMessage && (
          <div className="mb-6 p-3 bg-red-100 text-red-600 border border-red-200 rounded">
            {errorMessage}
          </div>
        )}
        {!!resetMessage && (
          <div className="mb-6 p-3 bg-green-100 text-green-600 border border-green-200 rounded">
            {resetMessage}
          </div>
        )}

        {/* Google Sign‑In */}
        <div id="google-signin" className="mb-6 flex justify-center" />

        {/* Email/Password Form */}
        <form onSubmit={handleLogin}>
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

          <label className="block mb-6">
            <span className="block text-gray-700 font-semibold mb-1">Password:</span>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button
            type="submit"
            className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
          >
            Login
          </button>
        </form>

        <p className="mt-4 text-center">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-pink-600 hover:text-pink-700 font-bold"
          >
            Forgot Password?
          </button>
        </p>

        <p className="mt-6 text-center text-gray-600">
          Don’t have an account?{" "}
          <Link href="/auth/signup" className="text-pink-600 hover:text-pink-700 font-bold">
            Sign Up
          </Link>
        </p>
      </div>
    </>
  );
}
