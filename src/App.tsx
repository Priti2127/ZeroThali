import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Staff from './pages/Staff';
import Receiver from './pages/Receiver';
import Biogas from './pages/Biogas';
import Admin from './pages/Admin';
import Navbar from './components/Navbar';
import { useEffect } from 'react';
import { supabase } from './services/supabase';

function App() {
  // Keep auth session alive across refreshes
  useEffect(() => {
    supabase.auth.onAuthStateChange((_event, _session) => {});
  }, []);

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/receiver" element={<Receiver />} />
        <Route path="/biogas" element={<Biogas />} />
        <Route path="/admin" element={<Admin />} />
        {/* Fallback for unknown routes – SPA rewrite */}
        <Route path="*" element={<Landing />} />
      </Routes>
    </Router>
  );
}

export default App;
