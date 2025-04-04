import "./globals.css";

// /src/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>TurnTalk</title>
        <meta name="description" content="An interactive AI-powered book club experience" />
      </head>
      <body className="bg-gray-100 text-gray-900">
        <header className="bg-gray-800 text-white p-4">
          <h1 className="text-xl">TurnTalk</h1>
        </header>
        <main className="p-4">{children}</main>
      </body>
    </html>
  );
}

