import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-dark-950 text-gray-300">
      {/* Header */}
      <div className="border-b border-dark-800 bg-dark-900">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neon-green flex items-center justify-center">
              <span className="text-dark-950 font-bold text-sm">T</span>
            </div>
            <span className="text-white font-bold text-lg">TrackAsap</span>
          </div>
          <Link
            to="/login"
            className="text-neon-green text-sm hover:underline transition"
          >
            ← Back to App
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: July 5, 2026</p>

        <div className="space-y-10 text-[15px] leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              Welcome to <strong className="text-neon-green">TrackAsap</strong> ("we", "our", or "us").
              We are committed to protecting your privacy. This Privacy Policy explains how we collect,
              use, and safeguard your information when you use the TrackAsap mobile application and web platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li><strong className="text-gray-200">Account Information:</strong> Name, email address, and profile photo collected via Google Sign-In.</li>
              <li><strong className="text-gray-200">Usage Data:</strong> Daily tasks, DSA sheet progress, physique metrics, and discussion posts you create within the app.</li>
              <li><strong className="text-gray-200">Platform Handles:</strong> Competitive programming usernames (LeetCode, Codeforces, etc.) that you optionally provide for stats tracking.</li>
              <li><strong className="text-gray-200">Device Information:</strong> Basic device data for crash reporting and performance monitoring.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>To provide and improve TrackAsap's core features (task tracking, analytics, sheets).</li>
              <li>To authenticate your identity securely via Google OAuth.</li>
              <li>To display your progress statistics and personalized dashboard.</li>
              <li>To send important account-related notifications (no marketing spam).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Data Sharing</h2>
            <p className="text-gray-400">
              We do <strong className="text-white">not</strong> sell, trade, or rent your personal data to third parties.
              Your data may be shared only in the following limited circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-400 mt-3">
              <li><strong className="text-gray-200">Google OAuth:</strong> Authentication is handled by Google. We only receive your basic profile info.</li>
              <li><strong className="text-gray-200">Legal compliance:</strong> If required by law or to protect our rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Storage & Security</h2>
            <p className="text-gray-400">
              Your data is stored securely on our servers. We implement industry-standard security measures
              including encrypted connections (HTTPS), secure authentication tokens, and access controls.
              However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Your Rights</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li><strong className="text-gray-200">Access:</strong> You can view all your data within the app at any time.</li>
              <li><strong className="text-gray-200">Delete:</strong> You can request deletion of your account and all associated data by contacting us.</li>
              <li><strong className="text-gray-200">Correction:</strong> You can update your profile information from the app settings.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Children's Privacy</h2>
            <p className="text-gray-400">
              TrackAsap is not directed at children under 13. We do not knowingly collect personal information
              from children under 13. If you believe a child has provided us with personal data, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Changes to This Policy</h2>
            <p className="text-gray-400">
              We may update this Privacy Policy from time to time. We will notify you of significant changes
              by updating the "Last updated" date at the top of this page. Continued use of the app
              constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Contact Us</h2>
            <p className="text-gray-400">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <div className="mt-3 p-4 rounded-xl bg-dark-800 border border-dark-700 space-y-1">
              <p className="text-gray-200">📧 <strong>Email:</strong> rajgupta8340@gmail.com</p>
              <p className="text-gray-200">📱 <strong>Phone:</strong> +91 8083834895</p>
              <p className="text-gray-200">🌐 <strong>App:</strong> TrackAsap — available on Indus App Store</p>
            </div>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-dark-800 text-center text-sm text-gray-600">
          © {new Date().getFullYear()} TrackAsap. All rights reserved.
        </div>
      </div>
    </div>
  );
}
