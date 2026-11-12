import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-light dark:bg-dark-bg flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl mb-6">🍽️</div>
        <h1 className="text-6xl font-bold text-primary dark:text-saffron mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Page Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Oops! This page doesn't exist. The thali is empty here.
          Let's get you back to something delicious.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition shadow-md"
        >
          🏠 Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
