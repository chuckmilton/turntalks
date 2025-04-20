// app/auth/signup/page.tsx
"use client";

declare const google: any;

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Head from "next/head";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import useRedirectIfAuth from "@/hooks/useRedirectIfAuth";

export default function SignupPage() {
  useRedirectIfAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (typeof google !== "undefined" && google.accounts?.id) {
      google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        callback: handleGoogleResponse,
      });
      google.accounts.id.renderButton(
        document.getElementById("google-signup")!,
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

  const handleSignup = async (e: React.FormEvent) => {
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
    } catch (err: any) {
      const msg = err.error_description || err.message;
      if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("already registered")) {
        setErrorMessage("This email is already registered. Please log in instead.");
      } else {
        setErrorMessage(msg);
      }
    }
  };

  return (
    <>
      <Head>
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </Head>
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

        {/* Google Sign‑Up Button Container */}
        <div id="google-signup" className="mb-6 flex justify-center"></div>

        {/* Only show the email form if sign‑up hasn’t succeeded yet */}
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
