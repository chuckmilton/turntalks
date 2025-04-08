import "./globals.css";
import Link from "next/link";

// /src/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>TurnTalks</title>
        <meta name="description" content="An interactive AI-powered book club experience" />
      </head>
      <body className="bg-gray-50 text-gray-900 font-sans flex flex-col min-h-screen">
        {/* Header / Navbar */}
        <header className="relative z-10 bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/">
              <h1 className="text-2xl font-bold text-gray-800 cursor-pointer hover:scale-105 transition-transform duration-300">
                TurnTalks
              </h1>
            </Link>
            <nav className="space-x-6">
              <Link href="/" className="text-gray-800 hover:text-blue-600 transition-colors">
                Home
              </Link>
              <Link href="/dashboard" className="text-gray-800 hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
              <Link href="/about" className="text-gray-800 hover:text-blue-600 transition-colors">
                About
              </Link>
            </nav>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex">
          <div className="flex-1 flex flex-col justify-center max-w-7xl w-full mx-auto px-6 py-8 animate-fadeInUp">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t py-6">
          <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} TurnTalks. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
