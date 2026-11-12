import { useEffect, useState, useCallback } from 'react';
import Card from '../components/Card';
import Tag from '../components/Tag';
import { supabase } from '../services/supabase';
import { useRealtime } from '../hooks/useRealtime';
import { formatDistanceToNowStrict } from 'date-fns';
import type { BiogasQueueRow } from '../types';

export default function Biogas() {
  const [queue, setQueue] = useState<BiogasQueueRow[]>([]);
  const [marking, setMarking] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    // Note: biogas_queue view joins food_logs + messes but doesn't include food_item.
    // We select directly from food_logs for the full picture.
    const { data, error } = await supabase
      .from('food_logs')
      .select('id,food_item,quantity_kg,created_at,mess_id,messes(name)')
      .eq('condition', 'unfit')
      .neq('status', 'biogas')
      .order('created_at', { ascending: true });

    if (!error) {
      setQueue(
        (data ?? []).map((row: any) => ({
          id: row.id,
          mess_id: row.mess_id,
          mess_name: row.messes?.name ?? '—',
          food_item: row.food_item,
          quantity_kg: row.quantity_kg,
          created_at: row.created_at,
        }))
      );
    }
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);
  useRealtime('food_logs', fetchQueue);

  const markLoaded = async (id: string) => {
    setMarking(id);
    const { error } = await supabase.from('food_logs').update({ status: 'biogas' }).eq('id', id);
    if (error) alert(error.message);
    else setQueue((prev) => prev.filter((w) => w.id !== id));
    setMarking(null);
  };

  const totalKg = queue.reduce((s, w) => s + Number(w.quantity_kg), 0);
  const biogasM3 = (totalKg * 0.12).toFixed(2);
  const lpgKg    = (totalKg * 0.12 * 0.43).toFixed(2);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Biogas Queue</h1>
      <p className="text-gray-500 text-sm mb-4">Unfit food waiting to be loaded into the biogas plant.</p>

      {/* Summary banner */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total waste', value: `${totalKg} kg` },
          { label: 'Est. biogas', value: `${biogasM3} m³` },
          { label: 'LPG saved', value: `${lpgKg} kg` },
        ].map(({ label, value }) => (
          <Card key={label} className="text-center py-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-lg font-bold text-primary">{value}</p>
          </Card>
        ))}
      </div>

      {queue.length === 0 ? (
        <Card className="text-center py-10 text-gray-400">
          <div className="text-3xl mb-2">♻️</div>
          Queue is empty — all waste has been loaded!
        </Card>
      ) : (
        queue.map((w) => (
          <Card key={w.id} className="mb-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{w.food_item}</p>
                <p className="text-sm text-gray-600">{w.quantity_kg} kg — {w.mess_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDistanceToNowStrict(new Date(w.created_at), { addSuffix: true })}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Tag status="unfit" />
                <button
                  onClick={() => markLoaded(w.id)}
                  disabled={marking === w.id}
                  className="bg-brick text-white py-1 px-3 rounded text-sm hover:bg-[#9c4531] disabled:opacity-60 transition"
                >
                  {marking === w.id ? 'Saving…' : '♻️ Mark loaded'}
                </button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
