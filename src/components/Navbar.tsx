"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  // Decide how to style each link based on whether it matches the current path
  const linkClasses = (href: string) =>
    `text-xl px-3 py-2 transition-colors ${
      pathname === href
        ? "font-bold text-pink-600 border-pink-600"
        : "text-black hover:text-pink-600"
    }`;

  return (
    <nav className="flex space-x-4">
      <Link href="/" className={linkClasses("/")}>
        Home
      </Link>
      <Link href="/dashboard" className={linkClasses("/dashboard")}>
        Dashboard
      </Link>
      <Link href="/about" className={linkClasses("/about")}>
        About
      </Link>
    </nav>
  );
}
