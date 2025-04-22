// app/auth/reset/ClientReset.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ClientReset() {
  const router = useRouter();
  const [stage, setStage] = useState<"loading" | "form" | "done">("loading");
  const [msg, setMsg] = useState<string>("");

  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  // 1️⃣ On mount, check for an active session
  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        // user has been logged in by the recovery flow
        setStage("form");
      } else {
        setMsg("Invalid or expired reset link.");
        setStage("done");
      }
    })();
  }, []);

  // 2️⃣ Submit new password
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      setMsg("Passwords do not match.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    if (error) {
      setMsg(error.message);
    } else {
      setMsg("Password updated! Redirecting to login…");
      setStage("done");
      setTimeout(() => router.push("/auth/login"), 2000);
    }
  };

  if (stage === "loading") {
    return (
      <div className="w-full max-w-lg mx-auto my-10 p-10 bg-white shadow-lg rounded-xl animate-fadeInUp">
        <p className="text-center text-gray-700">Verifying reset link…</p>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div className="w-full max-w-lg mx-auto my-10 p-10 bg-white shadow-lg rounded-xl animate-fadeInUp text-center">
        <p
          className={`font-semibold ${
            msg.includes("updated") ? "text-green-600" : "text-red-600"
          }`}
        >
          {msg}
        </p>
      </div>
    );
  }

  // stage === "form"
  return (
    <div className="w-full max-w-lg mx-auto my-10 p-10 bg-white shadow-lg rounded-xl animate-fadeInUp">
      <h2 className="text-4xl font-bold mb-6 text-center text-gray-800">
        Reset Password
      </h2>

      {msg && (
        <div className="mb-6 p-3 bg-red-100 text-red-600 border border-red-200 rounded">
          {msg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label className="block mb-4">
          <span className="block text-gray-700 font-semibold mb-1">
            New Password:
          </span>
          <input
            type="password"
            className="w-full border border-gray-300 rounded-md p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-pink-500"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            required
          />
        </label>
        <label className="block mb-6">
          <span className="block text-gray-700 font-semibold mb-1">
            Confirm Password:
          </span>
          <input
            type="password"
            className="w-full border border-gray-300 rounded-md p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-pink-500"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
        >
          Update Password
        </button>
      </form>
    </div>
  );
}
