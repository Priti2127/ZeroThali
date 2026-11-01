import { useEffect, useState } from 'react';
import Card from '../components/Card';
import Tag from '../components/Tag';
import { supabase } from '../services/supabase';
import { formatDistanceToNowStrict } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

type FoodLog = {
  id: string;
  mess_id: string;
  staff_id: string;
  food_item: string;
  quantity_kg: number;
  cooked_at: string;
  condition: 'edible' | 'unfit';
  photo_url?: string | null;
  status: 'available' | 'claimed' | 'collected' | 'biogas';
  claim_code?: string | null;
  claimed_by?: string | null;
  claimed_at?: string | null;
  created_at: string;
};

export default function Staff() {
  const [messList, setMessList] = useState<Array<{ id: string; name: string }>>([]);
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [form, setForm] = useState({
    mess_id: '',
    food_item: '',
    quantity_kg: '',
    cooked_at: '',
    condition: 'edible' as const,
    photo: null as File | null,
    hygiene: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const user = supabase.auth.user();

  // Load messes and today’s logs
  useEffect(() => {
    supabase.from('messes').select('id,name').then(({ data }) => setMessList(data ?? []));
    supabase
      .from<FoodLog>('food_logs')
      .select('*')
      .eq('staff_id', user?.id ?? '')
      .order('created_at', { ascending: false })
      .then(({ data }) => setLogs(data ?? []));
  }, [user]);

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
    let photoUrl = null;
    if (form.photo) {
      const { data, error: uploadError } = await supabase.storage
        .from('food-photos')
        .upload(`public/${uuidv4()}_${form.photo.name}`, form.photo);
      if (uploadError) {
        setError('Photo upload failed');
        setLoading(false);
        return;
      }
      photoUrl = supabase.storage.from('food-photos').getPublicUrl(data?.path).publicURL;
    }
    const { error: insertError } = await supabase.from('food_logs').insert({
      mess_id: form.mess_id,
      staff_id: user?.id,
      food_item: form.food_item,
      quantity_kg: Number(form.quantity_kg),
      cooked_at: form.cooked_at,
      condition: form.condition,
      photo_url: photoUrl,
    });
    if (insertError) setError(insertError.message);
    else {
      // Refresh list
      const { data } = await supabase
        .from<FoodLog>('food_logs')
        .select('*')
        .eq('staff_id', user?.id ?? '')
        .order('created_at', { ascending: false });
      setLogs(data ?? []);
      setForm({ mess_id: '', food_item: '', quantity_kg: '', cooked_at: '', condition: 'edible', photo: null, hygiene: false });
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Log today’s surplus</h1>
      <Card className="mb-6">
        <div className="space-y-3">
          <select
            className="w-full p-2 border rounded"
            value={form.mess_id}
            onChange={(e) => setForm({ ...form, mess_id: e.target.value })}
          >
            <option value="">Select mess</option>
            {messList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Food item (e.g., Veg Curry)"
            className="w-full p-2 border rounded"
            value={form.food_item}
            onChange={(e) => setForm({ ...form, food_item: e.target.value })}
          />

          <input
            type="number"
            placeholder="Quantity (kg)"
            className="w-full p-2 border rounded"
            value={form.quantity_kg}
            onChange={(e) => setForm({ ...form, quantity_kg: e.target.value })}
          />

          <input
            type="datetime-local"
            className="w-full p-2 border rounded"
            value={form.cooked_at}
            onChange={(e) => setForm({ ...form, cooked_at: e.target.value })}
          />

          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="condition"
                value="edible"
                checked={form.condition === 'edible'}
                onChange={() => setForm({ ...form, condition: 'edible' })}
                className="mr-2"
              />
              Edible
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="condition"
                value="unfit"
                checked={form.condition === 'unfit'}
                onChange={() => setForm({ ...form, condition: 'unfit' })}
                className="mr-2"
              />
              Unfit
            </label>
          </div>

          {form.condition === 'edible' && (
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={form.hygiene}
                onChange={(e) => setForm({ ...form, hygiene: e.target.checked })}
                className="mr-2"
              />
              Hygiene checklist (covered, clean container, cooked ≤ 4 h)
            </label>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setForm({ ...form, photo: e.target.files?.[0] ?? null })}
          />

          {error && <p className="text-red-600">{error}</p>}

          <button
            onClick={handlePublish}
            disabled={loading}
            className="bg-saffron text-white w-full py-2 rounded hover:bg-[#d9970b]"
          >
            {loading ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </Card>

      <h2 className="text-xl font-semibold mb-3">Today’s logs</h2>
      {logs.map((log) => (
        <Card key={log.id} className="mb-3 flex justify-between items-center">
          <div>
            <p className="font-medium">{log.food_item}</p>
            <p className="text-sm text-gray-600">{log.quantity_kg} kg</p>
          </div>
          <div className="flex items-center space-x-2">
            <Tag status={log.condition === 'edible' ? 'edible' : 'unfit'} />
            {log.condition === 'edible' && log.status === 'available' && (
              <span className="text-sm text-gray-500">
                Pickup within{' '}
                {formatDistanceToNowStrict(new Date(log.created_at), { addSuffix: false })}
              </span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
