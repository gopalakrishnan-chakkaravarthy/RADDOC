import React, { useEffect, useState } from 'react';
import { Building2, Loader2, Save, Users } from 'lucide-react';
import { getHospitalMappings, mapUserToHospital } from '../services/api';

export function HospitalMappings({ onMappingComplete }: { onMappingComplete: () => void }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof getHospitalMappings>> | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [selectedHospitals, setSelectedHospitals] = useState<Record<string, string>>({});
  const refresh = async () => {
    try {
      const mappings = await getHospitalMappings();
      setData(mappings);
      setSelectedHospitals(Object.fromEntries(mappings.users.map(user => [user.id, user.tenant_id || ''])));
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load mappings.'); }
  };
  useEffect(() => { void refresh(); }, []);

  async function assign(id: string) {
    const tenantId = selectedHospitals[id];
    if (!tenantId) return;
    setBusy(id); setError('');
    try {
      await mapUserToHospital(id, tenantId);
      onMappingComplete();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save hospital mapping.'); }
    finally { setBusy(''); }
  }

  if (!data) return <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-10 text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin"/>Loading hospital mappings…</div>;
  return <div className="space-y-5">
      <div><h2 className="text-lg font-bold text-slate-900">User and hospital mapping</h2><p className="mt-1 text-sm text-slate-500">Assign each registered login to a hospital. Users can access only the hospital and patient records assigned to their login.</p></div>
    {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-800"><Users size={17}/>Login accounts</div>
      <div className="divide-y divide-slate-100">
        {data.users.map(user => <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-52"><div className="font-medium text-slate-800">{user.name}</div><div className="text-xs text-slate-500">{user.email} · {user.role}</div></div>
          <div className="flex items-center gap-2"><Building2 size={16} className="text-cyan-700"/><select aria-label={`Hospital for ${user.email}`} value={selectedHospitals[user.id] ?? ''} disabled={busy === user.id} onChange={e => setSelectedHospitals(current => ({ ...current, [user.id]: e.target.value }))} className="min-w-52 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"><option value="" disabled>Select hospital</option>{data.tenants.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select><button type="button" onClick={() => void assign(user.id)} disabled={busy === user.id || !selectedHospitals[user.id] || selectedHospitals[user.id] === user.tenant_id} className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-700 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-45">{busy === user.id ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}Save</button></div>
        </div>)}
        {data.users.length === 0 && <p className="p-4 text-sm text-slate-500">No accounts found.</p>}
      </div>
    </section>
  </div>;
}
