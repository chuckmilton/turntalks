// /src/app/about/page.tsx
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto p-8 bg-white shadow-lg rounded-xl animate-fadeInUp">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">About TurnTalks</h2>
      <p className="text-lg text-gray-700 mb-4">
        TurnTalks is an innovative, interactive AI-powered platform designed to enhance your conversations and creative sessions. Whether you’re hosting a book club, brainstorming business ideas, or engaging in deep discussions, TurnTalks helps facilitate seamless collaboration.
      </p>
      <p className="text-lg text-gray-700 mb-4">
        Our mission is to blend advanced AI technology with an intuitive user experience so that every session becomes an opportunity for growth and inspiration. With features like real-time speech-to-text, dynamic question generation, and session ratings, we help turn ideas into impactful conversations.
      </p>
      <p className="text-lg text-gray-700 mb-8">
        Join us today and discover a new way to explore your creativity and bring your conversations to life. We’re continuously improving our platform based on user feedback, ensuring that TurnTalks remains at the forefront of interactive discussion experiences.
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-3 bg-pink-600 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
      >
        Back to Home
      </Link>
    </div>
  );
}
