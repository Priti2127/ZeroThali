import { useEffect, useState, useCallback } from 'react';
import Card from '../components/Card';
import Tag from '../components/Tag';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { useRealtime } from '../hooks/useRealtime';
import { formatDistanceToNowStrict } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { FoodLogWithMess } from '../types';

function CollectForm({ log, onComplete }: { log: FoodLogWithMess; onComplete: (log: FoodLogWithMess, file?: File) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true);
    await onComplete(log, file ?? undefined);
    setLoading(false);
  };
  return (
    <div className="mt-3 pt-3 border-t flex flex-col gap-2">
      <label className="text-xs text-gray-500">Upload proof-of-collection photo (optional)</label>
      <input type="file" accept="image/*" capture="environment" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
      <button
        onClick={submit}
        disabled={loading}
        className="bg-midGreen text-white py-1.5 px-4 rounded font-medium hover:bg-[#164d36] disabled:opacity-60 transition self-start"
      >
        {loading ? 'Saving…' : '✔ Mark as collected'}
      </button>
    </div>
  );
}

export default function Receiver() {
  const { user } = useAuth();
  const [available, setAvailable] = useState<FoodLogWithMess[]>([]);
  const [myClaims, setMyClaims] = useState<FoodLogWithMess[]>([]);

  const fetchAvailable = useCallback(async () => {
    const { data } = await supabase
      .from('food_logs')
      .select('id,food_item,quantity_kg,condition,status,claim_code,created_at,mess_id,messes(name)')
      .eq('condition', 'edible')
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    setAvailable(
      (data ?? []).map((row: any) => ({ ...row, mess_name: row.messes?.name ?? '—' }))
    );
  }, []);

  const fetchMyClaims = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('food_logs')
      .select('id,food_item,quantity_kg,mess_id,messes(name),claim_code,created_at,claimed_at,status,condition')
      .eq('claimed_by', user.id)
      .neq('status', 'collected')
      .order('claimed_at', { ascending: false });

    setMyClaims(
      (data ?? []).map((row: any) => ({ ...row, mess_name: row.messes?.name ?? '—' }))
    );
  }, [user]);

  useEffect(() => {
    fetchAvailable();
    fetchMyClaims();
  }, [fetchAvailable, fetchMyClaims]);

  // Live updates — when staff publish new food it instantly appears here
  useRealtime('food_logs', () => { fetchAvailable(); fetchMyClaims(); });

  const claimItem = async (log: FoodLogWithMess) => {
    const claimCode = `ZT-${Math.floor(1000 + Math.random() * 9000)}`;
    const { error } = await supabase
      .from('food_logs')
      .update({
        status: 'claimed',
        claim_code: claimCode,
        claimed_by: user?.id,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', log.id);
    if (error) alert(error.message);
    // Realtime will refresh, but do optimistic update too
    setAvailable((prev) => prev.filter((l) => l.id !== log.id));
    setMyClaims((prev) => [{ ...log, status: 'claimed', claim_code: claimCode }, ...prev]);
  };

  const markCollected = async (log: FoodLogWithMess, file?: File) => {
    let photoUrl = null;
    if (file) {
      const { data, error } = await supabase.storage
        .from('food-photos')
        .upload(`public/${uuidv4()}_${file.name}`, file);
      if (error) { alert('Photo upload failed'); return; }
      photoUrl = supabase.storage.from('food-photos').getPublicUrl(data.path).data.publicUrl;
    }
    const { error } = await supabase
      .from('food_logs')
      .update({ status: 'collected', collected_at: new Date().toISOString(), collection_photo: photoUrl })
      .eq('id', log.id);
    if (error) alert(error.message);
    else setMyClaims((prev) => prev.filter((l) => l.id !== log.id));
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Pickups near you</h1>
      <p className="text-gray-500 text-sm mb-4">Claim edible food before it's gone.</p>

      {/* Available food */}
      {available.length === 0 ? (
        <Card className="text-center py-8 text-gray-400 mb-6">
          <div className="text-3xl mb-2">🍱</div>
          No edible food available right now. Check back soon!
        </Card>
      ) : (
        available.map((log) => (
          <Card key={log.id} className="mb-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{log.food_item}</p>
                <p className="text-sm text-gray-600">{log.quantity_kg} kg — {log.mess_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDistanceToNowStrict(new Date(log.created_at), { addSuffix: true })}
                </p>
              </div>
              <button
                onClick={() => claimItem(log)}
                className="bg-saffron text-white py-1.5 px-4 rounded font-medium hover:bg-[#d9970b] transition shrink-0"
              >
                Claim
              </button>
            </div>
          </Card>
        ))
      )}

      {/* My active claims */}
      <h2 className="text-xl font-semibold mt-8 mb-3">My active claims</h2>
      {myClaims.length === 0 ? (
        <p className="text-gray-500 text-sm">No active claims.</p>
      ) : (
        myClaims.map((log) => (
          <Card key={log.id} className="mb-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{log.food_item}</p>
                <p className="text-sm text-gray-600">{log.quantity_kg} kg — {log.mess_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Claim code: <strong className="text-primary font-mono">{log.claim_code}</strong>
                </p>
              </div>
              <Tag status="claimed" />
            </div>
            <CollectForm log={log} onComplete={markCollected} />
          </Card>
        ))
      )}
    </div>
  );
}
