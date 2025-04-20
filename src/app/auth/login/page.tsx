"use client";
// declare the Google object
declare const google: any;

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Head from "next/head";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import useRedirectIfAuth from "@/hooks/useRedirectIfAuth";

export default function LoginPage() {
  useRedirectIfAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  // Google Identity Services
  useEffect(() => {
    if (typeof google !== "undefined" && google.accounts?.id) {
      google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        callback: handleGoogleResponse,
      });
      google.accounts.id.renderButton(
        document.getElementById("google-signin")!,
        { theme: "outline", size: "large" }
      );
    }
  }, []);

  async function handleGoogleResponse(response: { credential: string }) {
    setErrorMessage("");
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: response.credential,
      });
      if (error) throw error;
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMessage(err.error_description || err.message);
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setResetMessage("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMessage(err.error_description || err.message);
    }
  };

  // ← UPDATED: call our own API route instead of supabase.resetPasswordForEmail
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
      if (!res.ok) throw new Error((await res.json()).error || res.statusText);
      setResetMessage("Reset link sent! Check your inbox.");
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  return (
    <>
      <Head>
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </Head>
      <div className="w-full max-w-lg mx-auto my-10 p-10 bg-white shadow-lg rounded-xl animate-fadeInUp">
        <h2 className="text-4xl font-bold mb-6 text-center text-gray-800">Login</h2>

        {errorMessage && (
          <div className="mb-6 p-3 bg-red-100 text-red-600 border border-red-200 rounded">
            {errorMessage}
          </div>
        )}
        {resetMessage && (
          <div className="mb-6 p-3 bg-green-100 text-green-600 border border-green-200 rounded">
            {resetMessage}
          </div>
        )}

        {/* Google Sign‑In */}
        <div id="google-signin" className="mb-6 flex justify-center"></div>

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
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/signup"
            className="text-pink-600 hover:text-pink-700 font-bold"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </>
  );
}
