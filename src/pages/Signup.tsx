import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader } from 'lucide-react';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'student' as 'student' | 'receiver',
    hostel_name: '',
    room_number: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.full_name) {
      toast.error('Please fill all required fields');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.full_name, form.role, {
      hostel_name: form.hostel_name || null,
      room_number: form.room_number || null,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account created! Please check your email to verify.');
      navigate('/login');
    }
  };

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-saffron transition';

  return (
    <div className="min-h-screen bg-gradient-to-br from-light via-white to-saffron/10 dark:from-dark-bg dark:via-dark-surface dark:to-primary/10 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-saffron rounded-2xl mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">Z</span>
          </div>
          <h1 className="text-3xl font-bold text-primary dark:text-white">Join ZeroThali</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Create your account</p>
        </div>

        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Your full name"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 6 characters"
                  className={inputClass + ' pr-12'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['student', 'receiver'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, role: r })}
                    className={`py-3 px-4 rounded-xl border-2 font-medium transition ${
                      form.role === r
                        ? 'border-primary bg-primary/10 text-primary dark:border-saffron dark:bg-saffron/10 dark:text-saffron'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {r === 'student' ? '🎓 Student' : '🤝 NGO/Receiver'}
                  </button>
                ))}
              </div>
            </div>

            {form.role === 'student' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hostel Name
                  </label>
                  <input
                    type="text"
                    value={form.hostel_name}
                    onChange={(e) => setForm({ ...form, hostel_name: e.target.value })}
                    placeholder="e.g. Block A"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Room No.
                  </label>
                  <input
                    type="text"
                    value={form.room_number}
                    onChange={(e) => setForm({ ...form, room_number: e.target.value })}
                    placeholder="e.g. 204"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold text-lg transition shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={20} className="animate-spin" /> Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary dark:text-saffron font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
