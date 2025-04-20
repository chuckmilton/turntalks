// app/auth/reset/ClientReset.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ClientReset() {
  const params = useSearchParams();
  const router = useRouter();
  const code = params.get("code") ?? "";

  const [stage, setStage] = useState<"verifying" | "form" | "done">("verifying");
  const [msg, setMsg] = useState<string | null>(null);
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  useEffect(() => {
    if (!code) {
      setMsg("Invalid or missing link.");
      return setStage("done");
    }
    (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setMsg(error.message);
        setStage("done");
      } else {
        setStage("form");
      }
    })();
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (newPwd !== confirmPwd) {
      return setMsg("Passwords do not match.");
    }
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    if (error) {
      setMsg(error.message);
    } else {
      setMsg("Password updated! Redirecting…");
      setStage("done");
      setTimeout(() => router.push("/auth/login"), 2000);
    }
  };

  if (stage === "verifying") return <p className="text-center mt-20">Verifying link…</p>;
  if (stage === "done")
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white shadow rounded text-center">
        <p className={`font-semibold ${msg?.includes("updated") ? "text-green-600" : "text-red-600"}`}>
          {msg}
        </p>
      </div>
    );

  // form
  return (
    <div className="max-w-md mx-auto my-20 p-8 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4 text-center">Reset Password</h2>
      {msg && <p className="mb-4 text-center text-red-600">{msg}</p>}
      <form onSubmit={handleSubmit}>
        <label className="block mb-4">
          <span>New Password</span>
          <input
            type="password"
            className="w-full border p-2 rounded mt-1"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            required
          />
        </label>
        <label className="block mb-6">
          <span>Confirm Password</span>
          <input
            type="password"
            className="w-full border p-2 rounded mt-1"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
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
