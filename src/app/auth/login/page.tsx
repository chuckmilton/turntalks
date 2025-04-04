// /src/app/auth/login/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="max-w-md mx-auto my-10 p-4 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <form onSubmit={handleLogin}>
        <label className="block mb-2">
          Email:
          <input
            type="email"
            className="w-full border p-2 mt-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block mb-4">
          Password:
          <input
            type="password"
            className="w-full border p-2 mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="w-full py-2 bg-blue-500 text-white rounded">
          Login
        </button>
      </form>
    </div>
  );
}
