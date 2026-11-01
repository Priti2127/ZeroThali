import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { supabase } from '../services/supabase';
import { useState } from 'react';
import { AuthError } from '@supabase/supabase-js';

export default function Landing() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'staff' | 'receiver' | 'admin' | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email || !role) {
      setError('Pick a role and enter an email');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) setError((error as AuthError).message);
    else {
      localStorage.setItem('zerothali_role', role);
      // After magic link click, Supabase will redirect back.
      // For now we navigate to role‑specific page.
      if (role === 'staff') navigate('/staff');
      else if (role === 'receiver') navigate('/receiver');
      else if (role === 'admin') navigate('/admin');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-4 text-primary">ZeroThali</h1>
      <p className="mb-6 text-gray-700">Surplus food to people. Spoiled food to biogas.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card
          className={`cursor-pointer ${role === 'staff' ? 'border-2 border-primary' : ''}`}
          onClick={() => setRole('staff')}
        >
          <h2 className="font-medium">Mess Staff</h2>
        </Card>
        <Card
          className={`cursor-pointer ${role === 'receiver' ? 'border-2 border-primary' : ''}`}
          onClick={() => setRole('receiver')}
        >
          <h2 className="font-medium">Receiver / NGO</h2>
        </Card>
        <Card
          className={`cursor-pointer ${role === 'admin' ? 'border-2 border-primary' : ''}`}
          onClick={() => setRole('admin')}
        >
          <h2 className="font-medium">College Admin</h2>
        </Card>
      </div>

      <input
        type="email"
        placeholder="your@email.com"
        className="w-full p-2 border rounded mb-4"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <button
        onClick={login}
        disabled={loading}
        className="bg-saffron text-white w-full py-2 rounded hover:bg-[#d9970b] transition"
      >
        {loading ? 'Sending magic link…' : 'Send magic link'}
      </button>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-2">How it works</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-600">
          <li>Mess staff logs surplus food.</li>
          <li>NGOs / needy receivers claim edible food.</li>
          <li>Unfit food is sent to the campus biogas plant.</li>
          <li>College admin sees impact KPIs.</li>
        </ol>
      </section>
    </div>
  );
}
