import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  TrendingDown,
  Users,
  Bell,
  CheckCircle,
  BarChart3,
  Shield,
  Leaf,
} from 'lucide-react';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-light via-white to-saffron/10 dark:from-dark-bg dark:via-dark-surface dark:to-primary/10">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-saffron rounded-2xl mb-6 shadow-lg">
            <span className="text-white font-bold text-4xl">Z</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-primary dark:text-white mb-6">
            ZeroThali
          </h1>

          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-4 max-w-3xl mx-auto">
            Smart College Hostel Mess Management
          </p>

          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Reduce food waste, optimize meal planning, and ensure no one goes hungry
            with our intelligent mess management system
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/signup"
              className="px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold text-lg transition shadow-lg hover:shadow-xl"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-white dark:bg-dark-surface hover:bg-gray-50 dark:hover:bg-gray-800 text-primary dark:text-saffron border-2 border-primary dark:border-saffron rounded-lg font-semibold text-lg transition shadow-md"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary dark:text-white mb-4">
            Why ZeroThali?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Built specifically for college hostel messes with features that matter
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-md hover:shadow-xl transition border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-primary dark:text-saffron" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Meal Confirmation
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Students confirm meals before cutoff time. No more cooking for ghosts!
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-md hover:shadow-xl transition border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-saffron/10 dark:bg-saffron/20 rounded-lg flex items-center justify-center mb-4">
              <TrendingDown className="w-6 h-6 text-saffron" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Waste Tracking
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Compare wastage across meals and dishes. Get actionable insights to reduce waste.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-md hover:shadow-xl transition border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-brick-red/10 dark:bg-brick-red/20 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-brick-red" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Smart Prediction
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              AI-powered walk-in predictions. Cook the right amount every time.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-md hover:shadow-xl transition border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center mb-4">
              <Bell className="w-6 h-6 text-primary dark:text-saffron" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Leftover Alerts
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Real-time alerts to NGOs and locals when surplus food is available.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-md hover:shadow-xl transition border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-saffron/10 dark:bg-saffron/20 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-saffron" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Student Feedback
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Rate meals, tag issues, and help improve food quality over time.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-md hover:shadow-xl transition border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-brick-red/10 dark:bg-brick-red/20 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-brick-red" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Analytics Dashboard
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive reports on wastage trends, ratings, and cost savings.
            </p>
          </div>

          {/* Feature 7 */}
          <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-md hover:shadow-xl transition border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary dark:text-saffron" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Role-Based Access
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Secure access control for students, managers, receivers, and admins.
            </p>
          </div>

          {/* Feature 8 */}
          <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-md hover:shadow-xl transition border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-saffron/10 dark:bg-saffron/20 rounded-lg flex items-center justify-center mb-4">
              <Leaf className="w-6 h-6 text-saffron" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Sustainability First
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Anti-dependency design ensures surplus food stays occasional, not expected.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary to-saffron py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to transform your mess?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Join progressive colleges that are reducing waste and improving student satisfaction
          </p>
          <Link
            to="/signup"
            className="inline-block px-8 py-4 bg-white hover:bg-gray-100 text-primary rounded-lg font-semibold text-lg transition shadow-lg hover:shadow-xl"
          >
            Start Free Today
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-primary dark:bg-dark-surface py-8 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-white/80 dark:text-gray-400">
            © 2026 ZeroThali. Built for sustainable hostel mess management.
          </p>
          <p className="text-white/60 dark:text-gray-500 text-sm mt-2">
            No more wasted food. No more hungry students.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
