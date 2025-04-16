"use client";
import Link from "next/link";
import { motion } from "framer-motion";

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-xl animate-fadeInUp">
      <motion.h1
        className="text-4xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        Terms of Service
      </motion.h1>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-700 mb-4">1. Introduction</h2>
        <p className="text-gray-600 leading-relaxed">
          Welcome to TurnTalks. By accessing or using our website, applications, or services (collectively, &quot;Services&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you must not use our Services.
        </p>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-700 mb-4">2. Acceptance of Terms</h2>
        <p className="text-gray-600 leading-relaxed">
          By creating an account, accessing, or using our Services, you confirm that you have read, understood, and agree to be bound by these Terms and our Privacy Policy, as well as any modifications made to them.
        </p>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-700 mb-4">3. Modifications</h2>
        <p className="text-gray-600 leading-relaxed">
          TurnTalks reserves the right to update or modify these Terms at any time. Changes will be posted on our website with an updated effective date. It is your responsibility to review these Terms periodically.
        </p>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-700 mb-4">4. User Responsibilities</h2>
        <p className="text-gray-600 leading-relaxed">
          You agree to use the Services in a manner that is lawful and complies with all applicable laws and regulations. You shall not misuse the Services by interfering with their normal operation, attempting to access nonpublic areas of the Services, or engaging in any activity that could harm our users or the integrity of our platforms.
        </p>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-700 mb-4">5. Intellectual Property</h2>
        <p className="text-gray-600 leading-relaxed">
          All content, features, and functionality of the Services, including but not limited to text, graphics, logos, icons, images, as well as the underlying software, is the property of TurnTalks or its licensors. You agree not to reproduce, duplicate, copy, sell, resell, or exploit any portion of the Services without our express written permission.
        </p>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-700 mb-4">6. Limitation of Liability</h2>
        <p className="text-gray-600 leading-relaxed">
          In no event shall TurnTalks, its affiliates, or its licensors be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising out of your access to or use of, or inability to access or use, the Services.
        </p>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-700 mb-4">7. Governing Law</h2>
        <p className="text-gray-600 leading-relaxed">
          These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which TurnTalks operates, without regard to its conflict of law provisions.
        </p>
      </motion.section>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="text-center mt-12"
      >
        <Link href="/" className="text-pink-600 hover:underline">
          Back to Home
        </Link>
      </motion.div>
    </div>
  );
}
