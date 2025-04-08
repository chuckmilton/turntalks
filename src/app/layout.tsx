import "./globals.css";
import Link from "next/link";
import Navbar from "../components/Navbar"; // adjust the path as needed

// /src/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>TurnTalks</title>
        <meta name="description" content="An interactive AI-powered book club experience" />

        <meta name="description" content="An interactive AI-powered book club experience" />

        {/* Favicon */}
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Standard Favicons */}
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />

        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

        {/* Android Chrome Icons */}
        <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png" />

        {/* Web App Manifest */}
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="bg-gray-50 text-gray-900 font-sans flex flex-col min-h-screen">
        {/* Header / Navbar */}
        <header className="relative z-10 bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
            <Link
              href="/"
              className="cursor-pointer hover:scale-105 transition-transform duration-300"
            >
              <img src="/logo.png" alt="TurnTalks Logo" className="h-16 w-auto" />
            </Link>
            <Navbar />
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
