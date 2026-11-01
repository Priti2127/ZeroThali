import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const session = supabase.auth.session();
    setUser(session?.user ?? null);
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="bg-primary text-white px-4 py-2 flex justify-between items-center">
      <Link to="/" className="text-2xl font-bold">
        ZeroThali
      </Link>
      <div className="space-x-4">
        {user ? (
          <>
            <button onClick={() => navigate('/staff')} className="hover:underline">
              Staff
            </button>
            <button onClick={() => navigate('/receiver')} className="hover:underline">
              Receiver
            </button>
            <button onClick={() => navigate('/admin')} className="hover:underline">
              Admin
            </button>
            <button onClick={logout} className="hover:underline">
              Log out
            </button>
          </>
        ) : (
          <Link to="/" className="hover:underline">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
