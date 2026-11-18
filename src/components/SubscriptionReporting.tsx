import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, FileSearch } from 'lucide-react';
import { getSubscriptionReport, SubscriptionReportData } from '../services/api';

const inputClass = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100';

export function SubscriptionReporting() {
  const [data, setData] = useState<SubscriptionReportData>({ plans: [], hospitals: [], reports: [] });
  const [tenantId, setTenantId] = useState('');
  const [planId, setPlanId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load(filters = { tenantId, planId, from, to }) {
    setLoading(true); setError('');
    try { setData(await getSubscriptionReport(filters)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load subscription report.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load({ tenantId: '', planId: '', from: '', to: '' }); }, []);

  const hospitalCounts = useMemo(() => {
    const counts = new Map<string, { name: string; plan: string; count: number }>();
    data.reports.forEach(report => {
      const current = counts.get(report.tenantId) || { name: report.hospitalName, plan: report.planName, count: 0 };
      current.count++;
      counts.set(report.tenantId, current);
    });
    return [...counts.values()];
  }, [data.reports]);

  const openReport = (id: string) => window.open(`/reports/${encodeURIComponent(id)}`, '_blank', 'noopener,noreferrer');

  return <div className="space-y-5">
    <header className="rounded-2xl bg-slate-900 p-6 text-white shadow-xl"><p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">System administration</p><h1 className="mt-1 text-xl font-bold">Subscription report</h1><p className="mt-1 text-sm text-slate-400">Review every report created by hospitals with a subscription plan.</p></header>
    {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
    <form onSubmit={event => { event.preventDefault(); void load(); }} className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 xl:grid-cols-5">
      <label className="text-xs font-semibold text-slate-600">Client hospital<select value={tenantId} onChange={event => setTenantId(event.target.value)} className={`${inputClass} mt-1 block w-full`}><option value="">All hospitals</option>{data.hospitals.map(hospital => <option key={hospital.tenant_id} value={hospital.tenant_id}>{hospital.hospital_name}</option>)}</select></label>
      <label className="text-xs font-semibold text-slate-600">Subscription plan<select value={planId} onChange={event => setPlanId(event.target.value)} className={`${inputClass} mt-1 block w-full`}><option value="">All plans</option>{data.plans.map(plan => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></label>
      <label className="text-xs font-semibold text-slate-600">From<input type="date" value={from} onChange={event => setFrom(event.target.value)} className={`${inputClass} mt-1 block w-full`}/></label>
      <label className="text-xs font-semibold text-slate-600">To<input type="date" value={to} onChange={event => setTo(event.target.value)} className={`${inputClass} mt-1 block w-full`}/></label>
      <div className="flex items-end gap-2"><button disabled={loading} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-600 disabled:opacity-50"><FileSearch size={16}/>{loading ? 'Loading…' : 'Run report'}</button><button type="button" onClick={() => { setTenantId(''); setPlanId(''); setFrom(''); setTo(''); void load({ tenantId: '', planId: '', from: '', to: '' }); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600">Clear</button></div>
    </form>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase text-slate-500">Matching reports</p><p className="mt-1 text-2xl font-bold text-slate-900">{data.reports.length.toLocaleString()}</p></div>
      <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase text-slate-500">Hospitals with reports</p><p className="mt-1 text-2xl font-bold text-slate-900">{hospitalCounts.length.toLocaleString()}</p></div>
      {hospitalCounts.slice(0, 2).map(hospital => <div key={hospital.name} className="rounded-xl border border-slate-200 bg-white p-4"><p className="truncate text-xs font-semibold uppercase text-slate-500" title={hospital.name}>{hospital.name}</p><p className="mt-1 text-2xl font-bold text-slate-900">{hospital.count.toLocaleString()} <span className="text-sm font-medium text-slate-500">reports</span></p><p className="mt-1 text-xs text-slate-500">{hospital.plan}</p></div>)}
    </section>
    <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-3 flex items-center justify-between"><h2 className="font-bold text-slate-900">Reports by hospital subscription</h2><span className="text-xs text-slate-500">{data.reports.length.toLocaleString()} records</span></div><table className="w-full min-w-[960px] text-left text-sm"><thead className="border-b bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-3 py-3">Hospital / plan</th><th className="px-3 py-3">Patient</th><th className="px-3 py-3">Report</th><th className="px-3 py-3">Accession</th><th className="px-3 py-3">Study date</th><th className="px-3 py-3">Status</th><th className="px-3 py-3"/></tr></thead><tbody className="divide-y divide-slate-100">
      {data.reports.map(report => <tr key={report.id}><td className="px-3 py-3"><div className="font-semibold text-slate-800">{report.hospitalName}</div><div className="text-xs text-slate-500">{report.planName}</div></td><td className="px-3 py-3"><div className="font-medium text-slate-800">{report.patient?.name || '—'}</div><div className="text-xs text-slate-500">{report.patient?.patientId || ''}</div></td><td className="px-3 py-3 text-slate-700">{report.templateName} <span className="text-xs text-slate-500">({report.modality})</span></td><td className="px-3 py-3 font-mono text-xs text-slate-600">{report.accessionNumber}</td><td className="px-3 py-3 text-slate-600">{new Date(report.studyDate).toLocaleDateString()}</td><td className="px-3 py-3"><span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{report.status}</span></td><td className="px-3 py-3"><button onClick={() => openReport(report.id)} className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-cyan-700 hover:text-cyan-900">Open report <ExternalLink size={14}/></button></td></tr>)}
      {!loading && data.reports.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-500">No reports match these subscription filters.</td></tr>}
      {loading && <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-500">Loading subscription report…</td></tr>}
    </tbody></table></section>
  </div>;
}
