import { useEffect, useState, useCallback } from 'react';
import Card from '../components/Card';
import Tag from '../components/Tag';
import { supabase } from '../services/supabase';
import { useRealtime } from '../hooks/useRealtime';
import { formatDistanceToNowStrict } from 'date-fns';
import type { AdminKPI, FoodLogWithMess, Mess } from '../types';

function StatCard({ icon, title, value, sub }: { icon: string; title: string; value: string | number; sub?: string }) {
  return (
    <Card className="text-center py-4">
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{title}</p>
      <p className="text-2xl font-bold text-primary mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </Card>
  );
}

export default function Admin() {
  const [kpi, setKpi] = useState<AdminKPI | null>(null);
  const [recentLogs, setRecentLogs] = useState<FoodLogWithMess[]>([]);
  const [messBreakdown, setMessBreakdown] = useState<
    { mess: Mess; edibleKg: number; unfitKg: number; collected: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    // KPI view
    const kpiRes = await supabase.from('admin_kpi').select('*').single();
    if (kpiRes.error) { setError(kpiRes.error.message); return; }
    setKpi(kpiRes.data as AdminKPI);

    // Recent 10 logs
    const logsRes = await supabase
      .from('food_logs')
      .select('id,food_item,quantity_kg,condition,status,created_at,mess_id,messes(name)')
      .order('created_at', { ascending: false })
      .limit(10);
    setRecentLogs(
      (logsRes.data ?? []).map((r: any) => ({ ...r, mess_name: r.messes?.name ?? '—' }))
    );

    // Mess-wise breakdown
    const messRes = await supabase.from('messes').select('id,name,created_at');
    const logsAllRes = await supabase
      .from('food_logs')
      .select('mess_id,condition,status,quantity_kg');

    if (messRes.data && logsAllRes.data) {
      const breakdown = (messRes.data as Mess[]).map((mess) => {
        const messLogs = logsAllRes.data.filter((l: any) => l.mess_id === mess.id);
        return {
          mess,
          edibleKg: messLogs
            .filter((l: any) => l.condition === 'edible')
            .reduce((s: number, l: any) => s + Number(l.quantity_kg), 0),
          unfitKg: messLogs
            .filter((l: any) => l.condition === 'unfit')
            .reduce((s: number, l: any) => s + Number(l.quantity_kg), 0),
          collected: messLogs.filter((l: any) => l.status === 'collected').length,
        };
      });
      setMessBreakdown(breakdown);
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useRealtime('food_logs', fetchAll);

  if (loading) return <div className="p-4 text-primary">Loading dashboard…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!kpi) return <div className="p-4 text-gray-500">No data available yet.</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
      <p className="text-gray-500 text-sm mb-6">All-time campus food rescue impact.</p>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        <StatCard icon="🍱" title="Edible items" value={kpi.total_edible} />
        <StatCard icon="⚖️" title="Kg edible food" value={`${kpi.kg_edible} kg`} sub="rescued" />
        <StatCard icon="⚠️" title="Unfit items" value={kpi.total_unfit} />
        <StatCard icon="🗑️" title="Kg unfit waste" value={`${kpi.kg_unfit} kg`} sub="to biogas" />
        <StatCard
          icon="💨"
          title="Est. biogas"
          value={`${kpi.biogas_m3} m³`}
          sub="at 0.12 m³/kg"
        />
        <StatCard
          icon="🔵"
          title="LPG saved"
          value={`${kpi.lpg_kg_saved} kg`}
          sub="equivalent"
        />
      </div>

      {/* Mess-wise breakdown */}
      <h2 className="text-lg font-semibold mb-3">Mess-wise breakdown</h2>
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-lightGrey">
              <th className="text-left p-2 font-semibold">Mess</th>
              <th className="p-2 text-center font-semibold">Edible (kg)</th>
              <th className="p-2 text-center font-semibold">Unfit (kg)</th>
              <th className="p-2 text-center font-semibold">Collections</th>
            </tr>
          </thead>
          <tbody>
            {messBreakdown.map(({ mess, edibleKg, unfitKg, collected }) => (
              <tr key={mess.id} className="border-b hover:bg-lightGrey/50">
                <td className="p-2 font-medium">{mess.name}</td>
                <td className="p-2 text-center text-edible font-semibold">{edibleKg}</td>
                <td className="p-2 text-center text-unfit font-semibold">{unfitKg}</td>
                <td className="p-2 text-center">{collected}</td>
              </tr>
            ))}
            {messBreakdown.length === 0 && (
              <tr><td colSpan={4} className="p-4 text-center text-gray-400">No mess data.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Recent activity */}
      <h2 className="text-lg font-semibold mb-3">Recent activity</h2>
      {recentLogs.length === 0 ? (
        <p className="text-gray-400 text-sm">No logs yet.</p>
      ) : (
        recentLogs.map((log) => (
          <Card key={log.id} className="mb-2 flex justify-between items-center py-2">
            <div>
              <p className="font-medium text-sm">{log.food_item}</p>
              <p className="text-xs text-gray-500">
                {log.quantity_kg} kg · {log.mess_name} ·{' '}
                {formatDistanceToNowStrict(new Date(log.created_at), { addSuffix: true })}
              </p>
            </div>
            <div className="flex gap-1 shrink-0 ml-2">
              <Tag status={log.condition} />
              <Tag status={log.status} />
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
