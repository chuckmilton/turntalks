"use client";
import Link from "next/link";
import { motion } from "framer-motion";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-xl animate-fadeInUp">
      <motion.h1
        className="text-4xl font-bold mb-6 text-gray-800 text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        Privacy Policy
      </motion.h1>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Introduction</h2>
        <p className="text-gray-600 leading-relaxed">
          This Privacy Policy describes how TurnTalks (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, and shares information about you when you visit or use our website, mobile applications, and other services (collectively, the &quot;Services&quot;). By using our Services, you agree to the collection and use of your information in accordance with this policy.
        </p>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Information Collection</h2>
        <p className="text-gray-600 leading-relaxed">
          We collect several different types of information for various purposes to provide and improve our Services to you.
        </p>
        <ul className="list-disc list-inside text-gray-600 mt-2">
          <li>
            <span className="font-semibold">Personal Data:</span> such as your name, email address, and any other information you provide when registering for an account.
          </li>
          <li>
            <span className="font-semibold">Usage Data:</span> information on how you access and use our Services.
          </li>
          <li>
            <span className="font-semibold">Cookies and Tracking Data:</span> data collected through cookies and similar tracking technologies.
          </li>
        </ul>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Use of Data</h2>
        <p className="text-gray-600 leading-relaxed">
          TurnTalks uses the collected data for various purposes:
        </p>
        <ul className="list-disc list-inside text-gray-600 mt-2">
          <li>To provide and maintain our Service</li>
          <li>To notify you about changes to our Service</li>
          <li>To allow you to participate in interactive features of our Service</li>
          <li>To provide customer support</li>
          <li>To gather analysis or valuable information so that we can improve our Service</li>
          <li>To monitor the usage of our Service</li>
          <li>To detect, prevent and address technical issues</li>
        </ul>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Sharing &amp; Disclosure</h2>
        <p className="text-gray-600 leading-relaxed">
          We may share your Personal Data with third parties only in the following circumstances:
        </p>
        <ul className="list-disc list-inside text-gray-600 mt-2">
          <li>With your consent</li>
          <li>For legal reasons if required by law or to protect our rights</li>
          <li>With service providers who assist us in delivering our Service</li>
        </ul>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Your Rights</h2>
        <p className="text-gray-600 leading-relaxed">
          You have the right to access, correct, or delete your personal data, as well as the right to object to certain processing. To exercise your rights, please contact us at our designated email address.
        </p>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Security</h2>
        <p className="text-gray-600 leading-relaxed">
          The security of your data is important to us, but remember that no method of transmission over the Internet is 100% secure. We strive to use commercially acceptable means to protect your Personal Data.
        </p>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Changes to This Privacy Policy</h2>
        <p className="text-gray-600 leading-relaxed">
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page, along with an updated effective date.
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
