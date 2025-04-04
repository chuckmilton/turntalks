// /src/app/page.tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="max-w-xl mx-auto my-10 p-4 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Welcome to TurnTalk</h2>
      <p className="mb-6">
        Create sessions, join interactive discussions, and let AI help you transform your ideas!
      </p>
      <div className="flex space-x-4">
        <Link href="/auth/login" className="px-4 py-2 bg-blue-500 text-white rounded">
          Login
        </Link>
        <Link href="/auth/signup" className="px-4 py-2 bg-green-500 text-white rounded">
          Sign Up
        </Link>
      </div>
    </div>
  );
}
