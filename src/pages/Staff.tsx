import { useEffect, useState, useCallback } from 'react';
import Card from '../components/Card';
import Tag from '../components/Tag';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { useRealtime } from '../hooks/useRealtime';
import { formatDistanceToNowStrict } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { FoodLog, Mess } from '../types';

type FormState = {
  mess_id: string;
  food_item: string;
  quantity_kg: string;
  cooked_at: string;
  condition: 'edible' | 'unfit';
  photo: File | null;
  hygiene: boolean;
};

const EMPTY_FORM: FormState = {
  mess_id: '',
  food_item: '',
  quantity_kg: '',
  cooked_at: '',
  condition: 'edible',
  photo: null,
  hygiene: false,
};

export default function Staff() {
  const { user } = useAuth();
  const [messList, setMessList] = useState<Mess[]>([]);
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load messes once
  useEffect(() => {
    supabase.from('messes').select('id,name,created_at').then(({ data }) =>
      setMessList((data as Mess[]) ?? [])
    );
  }, []);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('food_logs')
      .select('*')
      .eq('staff_id', user.id)
      .order('created_at', { ascending: false });
    setLogs((data as FoodLog[]) ?? []);
  }, [user]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Live updates — when other staff log food it shows up here too
  useRealtime('food_logs', fetchLogs);

  const handlePublish = async () => {
    if (!form.mess_id || !form.food_item || !form.quantity_kg || !form.cooked_at) {
      setError('Please fill all required fields');
      return;
    }
    if (form.condition === 'edible' && !form.hygiene) {
      setError('Hygiene checklist must be accepted for edible food');
      return;
    }
    setLoading(true);
    setError(null);

    let photoUrl = null;
    if (form.photo) {
      const { data, error: uploadError } = await supabase.storage
        .from('food-photos')
        .upload(`public/${uuidv4()}_${form.photo.name}`, form.photo);
      if (uploadError) {
        setError('Photo upload failed: ' + uploadError.message);
        setLoading(false);
        return;
      }
      photoUrl = supabase.storage.from('food-photos').getPublicUrl(data.path).data.publicUrl;
    }

    const { error: insertError } = await supabase.from('food_logs').insert({
      mess_id: form.mess_id,
      staff_id: user?.id,
      food_item: form.food_item.trim(),
      quantity_kg: Number(form.quantity_kg),
      cooked_at: form.cooked_at,
      condition: form.condition,
      photo_url: photoUrl,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setForm(EMPTY_FORM);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Log today's surplus</h1>
      <p className="text-gray-500 text-sm mb-4">Fill in what's left after the meal.</p>

      <Card className="mb-6">
        <div className="space-y-3">
          {/* Mess selector */}
          <select
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            value={form.mess_id}
            onChange={(e) => setForm({ ...form, mess_id: e.target.value })}
          >
            <option value="">Select mess *</option>
            {messList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Food item (e.g., Veg Curry) *"
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            value={form.food_item}
            onChange={(e) => setForm({ ...form, food_item: e.target.value })}
          />

          <input
            type="number"
            placeholder="Quantity (kg) *"
            min="0.1"
            step="0.5"
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            value={form.quantity_kg}
            onChange={(e) => setForm({ ...form, quantity_kg: e.target.value })}
          />

          <div>
            <label className="block text-xs text-gray-500 mb-1">Cooked at *</label>
            <input
              type="datetime-local"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              value={form.cooked_at}
              onChange={(e) => setForm({ ...form, cooked_at: e.target.value })}
            />
          </div>

          {/* Condition radio */}
          <div className="flex items-center gap-6">
            {(['edible', 'unfit'] as const).map((c) => (
              <label key={c} className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="condition"
                  value={c}
                  checked={form.condition === c}
                  onChange={() => setForm({ ...form, condition: c, hygiene: false })}
                />
                <span
                  className={`text-sm font-medium ${
                    c === 'edible' ? 'text-edible' : 'text-unfit'
                  }`}
                >
                  {c === 'edible' ? '✅ Edible' : '⚠️ Unfit (send to biogas)'}
                </span>
              </label>
            ))}
          </div>

          {/* Hygiene checklist — edible only */}
          {form.condition === 'edible' && (
            <label className="inline-flex items-start gap-2 cursor-pointer text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.hygiene}
                onChange={(e) => setForm({ ...form, hygiene: e.target.checked })}
                className="mt-0.5"
              />
              <span>
                Hygiene confirmed: food is covered, in a clean container, and cooked within the
                last 4 hours.
              </span>
            </label>
          )}

          {/* Photo */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Photo (optional)</label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setForm({ ...form, photo: e.target.files?.[0] ?? null })}
              className="text-sm"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            onClick={handlePublish}
            disabled={loading}
            className="bg-saffron text-white w-full py-2.5 rounded-card font-semibold hover:bg-[#d9970b] disabled:opacity-60 transition"
          >
            {loading ? 'Publishing…' : '📤 Publish'}
          </button>
        </div>
      </Card>

      {/* Today's logs */}
      <h2 className="text-xl font-semibold mb-3">Today's logs</h2>
      {logs.length === 0 && <p className="text-gray-500 text-sm">No logs yet today.</p>}
      {logs.map((log) => (
        <Card key={log.id} className="mb-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">{log.food_item}</p>
              <p className="text-sm text-gray-600">{log.quantity_kg} kg</p>
              {log.cooked_at && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Cooked {formatDistanceToNowStrict(new Date(log.cooked_at), { addSuffix: true })}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <Tag status={log.condition} />
              <Tag status={log.status as any} />
            </div>
          </div>
          {log.photo_url && (
            <img
              src={log.photo_url}
              alt={log.food_item}
              className="mt-2 w-full max-h-40 object-cover rounded-lg"
            />
          )}
        </Card>
      ))}
    </div>
  );
}
