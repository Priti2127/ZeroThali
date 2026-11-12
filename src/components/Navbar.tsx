import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, Sun, Moon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState(
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      toast.success('Signed out successfully');
      navigate('/');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const roleColors: Record<string, string> = {
    student: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    manager: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    receiver: 'bg-saffron/20 text-saffron-dark dark:bg-saffron/30',
    admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <nav className="bg-white dark:bg-dark-surface shadow-md border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-saffron rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">Z</span>
            </div>
            <span className="text-xl font-bold text-primary dark:text-white">ZeroThali</span>
          </Link>

          {/* Desktop Menu */}
          {user && (
            <div className="hidden md:flex items-center space-x-6">
              <Link
                to="/dashboard"
                className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-saffron transition"
              >
                Dashboard
              </Link>

              {user.role === 'student' && (
                <>
                  <Link
                    to="/meals"
                    className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-saffron transition"
                  >
                    Meals
                  </Link>
                  <Link
                    to="/feedback"
                    className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-saffron transition"
                  >
                    Feedback
                  </Link>
                </>
              )}

              {user.role === 'manager' && (
                <>
                  <Link
                    to="/leftovers"
                    className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-saffron transition"
                  >
                    Leftovers
                  </Link>
                </>
              )}

              {user.role === 'receiver' && (
                <>
                  <Link
                    to="/alerts"
                    className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-saffron transition"
                  >
                    Alerts
                  </Link>
                  <Link
                    to="/orders"
                    className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-saffron transition"
                  >
                    My Orders
                  </Link>
                </>
              )}

              <div className="flex items-center space-x-4">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  aria-label="Toggle theme"
                >
                  {theme === 'light' ? (
                    <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  ) : (
                    <Sun className="w-5 h-5 text-gray-300" />
                  )}
                </button>

                {/* User Info */}
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.full_name}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        roleColors[user.role] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                    aria-label="Sign out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Menu Button */}
          {user && (
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {user && isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface">
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-center space-x-3 pb-3 border-b border-gray-200 dark:border-gray-700">
              <User className="w-8 h-8 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{user.full_name}</p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    roleColors[user.role] || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>
            </div>

            <Link
              to="/dashboard"
              className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>

            {user.role === 'student' && (
              <>
                <Link
                  to="/meals"
                  className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Meals
                </Link>
                <Link
                  to="/feedback"
                  className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Feedback
                </Link>
              </>
            )}

            {user.role === 'receiver' && (
              <>
                <Link
                  to="/leftovers"
                  className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Leftovers
                </Link>
                <Link
                  to="/orders"
                  className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Orders
                </Link>
              </>
            )}

            <button
              onClick={toggleTheme}
              className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition flex items-center space-x-2"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              <span>Toggle Theme</span>
            </button>

            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition flex items-center space-x-2"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
