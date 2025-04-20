// app/auth/reset/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const code = params.get("code");

  const [stage, setStage] = useState<"verifying" | "form" | "done">("verifying");
  const [message, setMessage] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 1️⃣ On mount, exchange the code for a session
  useEffect(() => {
    if (!code) {
      setMessage("Invalid or missing link.");
      setStage("done");
      return;
    }
    (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setMessage(error.message);
        setStage("done");
      } else {
        // session is now set in storage—show the form
        setStage("form");
      }
    })();
  }, [code]);

  // 2️⃣ Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setMessage(error.message);
    } else {
      setStage("done");
      setMessage("Password updated! Redirecting to login…");
      setTimeout(() => router.push("/auth/login"), 2000);
    }
  };

  // 3️⃣ Render based on stage
  if (stage === "verifying") {
    return <p className="text-center mt-20">Verifying link…</p>;
  }

  if (stage === "done") {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white shadow rounded text-center">
        {message && (
          <p className={`font-semibold ${message.includes("updated") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}
      </div>
    );
  }

  // stage === "form"
  return (
    <div className="max-w-md mx-auto my-20 p-8 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4 text-center">Reset Password</h2>
      {message && <p className="mb-4 text-center text-red-600">{message}</p>}
      <form onSubmit={handleSubmit}>
        <label className="block mb-4">
          <span>New Password</span>
          <input
            type="password"
            className="w-full border p-2 rounded mt-1"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
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
        <button
          type="submit"
          className="w-full bg-pink-600 text-white py-2 rounded hover:bg-pink-700"
        >
          Update Password
        </button>
      </form>
    </div>
  );
}
