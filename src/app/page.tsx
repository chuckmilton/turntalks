// /src/app/page.tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="relative bg-gradient-to-r from-pink-500 to-orange-500 rounded-xl shadow-lg overflow-hidden">
      {/* Hero Section */}
      <div className="px-8 py-16 text-center text-white">
        <h2 className="text-4xl font-extrabold mb-4 drop-shadow-md">
          Welcome to TurnTalks
        </h2>
        <p className="mb-8 text-lg max-w-2xl mx-auto">
          Create sessions, join interactive discussions, and let AI help you transform your ideas!
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            href="/auth/login"
            className="px-6 py-3 bg-white text-pink-600 font-semibold rounded-md shadow hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            Login
          </Link>
          <Link
            href="/auth/signup"
            className="px-6 py-3 bg-pink-600 text-white font-semibold rounded-md shadow hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
