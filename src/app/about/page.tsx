"use client";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AboutPage() {
  // Reusable animation variants similar to your landing page.
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number = 0) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.2, duration: 0.6, ease: "easeOut" },
    }),
  };

  return (
    <>
      {/* Hero Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        custom={0}
        variants={sectionVariants}
        className="relative bg-gradient-to-r from-pink-500 to-orange-500 rounded-xl shadow-lg overflow-hidden mb-16"
      >
        <div className="px-8 py-20 text-center text-white">
          <motion.h1
            className="text-5xl font-extrabold mb-6 drop-shadow-lg"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            About TurnTalks
          </motion.h1>
          <motion.p
            className="mb-10 text-xl max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            TurnTalks is more than just a platform—it's a revolution in how we spark creativity and meaningful conversations.
          </motion.p>
        </div>
      </motion.section>

      {/* Vision and Mission Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        custom={1}
        variants={sectionVariants}
        className="mb-16 max-w-7xl mx-auto px-6"
      >
        <div className="grid gap-10 md:grid-cols-2">
          {/* Our Vision Card */}
          <div className="bg-white rounded-xl p-8 shadow hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Vision</h2>
            <p className="text-lg text-gray-700">
              We envision a world where every conversation ignites innovative ideas, and every dialogue transforms into a stepping stone for creativity. Our platform harnesses AI to empower communities to share, collaborate, and grow.
            </p>
          </div>
          {/* Our Mission Card */}
          <div className="bg-white rounded-xl p-8 shadow hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Mission</h2>
            <p className="text-lg text-gray-700">
              Our mission is to create an intuitive environment that bridges technology and creativity—making interactive sessions dynamic, seamless, and impactful for everyone.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Call to Action Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        custom={2}
        variants={sectionVariants}
        className="bg-white rounded-xl shadow-lg overflow-hidden mb-16 mx-6"
      >
        <div className="px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">Join the Revolution</h2>
          <p className="mb-8 text-gray-700 max-w-2xl mx-auto">
            Become part of our vibrant community and experience the future of dynamic conversations and creative brainstorming.
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-pink-600 text-white font-semibold rounded-md shadow hover:shadow-xl transition transform hover:-translate-y-1"
          >
            Back to Home
          </Link>
        </div>
      </motion.section>
    </>
  );
}
