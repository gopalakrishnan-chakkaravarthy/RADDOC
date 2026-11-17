import React, { useEffect, useState } from 'react';
import { BadgeDollarSign, Loader2, Save } from 'lucide-react';
import {
  assignHospitalPlan,
  getSubscriptionManagement,
  updateSubscriptionPlan,
  SubscriptionManagementData,
  SubscriptionPlan
} from '../services/api';

type PlanEdit = { price: string; users: string; reports: string; active: boolean };

export function SubscriptionManagement() {
  const [data, setData] = useState<SubscriptionManagementData | null>(null);
  const [selectedPlans, setSelectedPlans] = useState<Record<string, string>>({});
  const [planEdits, setPlanEdits] = useState<Record<string, PlanEdit>>({});
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function refresh() {
    try {
      const result = await getSubscriptionManagement();
      setData(result);
      setSelectedPlans(Object.fromEntries(result.hospitals.map(hospital => [hospital.tenantId, hospital.subscription?.plan.id || ''])));
      setPlanEdits(Object.fromEntries(result.plans.map(plan => [plan.id, {
        price: String(plan.annualPriceUsd),
        users: plan.maxUsers === null ? '' : String(plan.maxUsers),
        reports: plan.annualReportLimit === null ? '' : String(plan.annualReportLimit),
        active: plan.isActive
      }])));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load subscription plans.');
    }
  }

  useEffect(() => { void refresh(); }, []);

  async function savePlan(plan: SubscriptionPlan) {
    const edit = planEdits[plan.id];
    if (!edit) return;
    setBusy(`plan-${plan.id}`); setError(''); setSuccess('');
    try {
      const updated = await updateSubscriptionPlan(plan.id, {
        annualPriceUsd: Number(edit.price),
        maxUsers: edit.users.trim() ? Number(edit.users) : null,
        annualReportLimit: edit.reports.trim() ? Number(edit.reports) : null,
        isActive: edit.active
      });
      setData(current => current ? { ...current, plans: current.plans.map(item => item.id === updated.id ? updated : item) } : current);
      setSuccess(`${updated.name} plan configuration saved.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the plan.');
    } finally { setBusy(''); }
  }

  async function assignPlan(tenantId: string) {
    const planId = selectedPlans[tenantId];
    if (!planId) return;
    setBusy(`hospital-${tenantId}`); setError(''); setSuccess('');
    try {
      const subscription = await assignHospitalPlan(tenantId, planId);
      setData(current => current ? {
        ...current,
        hospitals: current.hospitals.map(hospital => hospital.tenantId === tenantId ? { ...hospital, subscription } : hospital)
      } : current);
      setSuccess('Subscription assigned for one year. The report allowance has been reset.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not assign the plan.');
    } finally { setBusy(''); }
  }

  if (!data) return <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-10 text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin"/>Loading subscription plans…</div>;

  return <div className="space-y-6">
    <div>
      <h2 className="text-lg font-bold text-slate-900">SaaS subscription plans</h2>
      <p className="mt-1 text-sm text-slate-500">Configure annual prices and limits, then assign a plan to each hospital. Report allowances reset when a plan is assigned or renewed.</p>
    </div>
    {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    {success && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}

    <section className="grid gap-4 md:grid-cols-3">
      {data.plans.map(plan => {
        const edit = planEdits[plan.id];
        return <article key={plan.id} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div><h3 className="font-bold text-slate-900">{plan.name}</h3><p className="text-xs text-slate-500">{plan.code}</p></div>
            <BadgeDollarSign className="h-5 w-5 text-cyan-700"/>
          </div>
          {edit && <>
            <label className="block text-xs font-semibold text-slate-600">Annual price (USD)<input type="number" min="0" step="0.01" value={edit.price} onChange={event => setPlanEdits(current => ({ ...current, [plan.id]: { ...edit, price: event.target.value } }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"/></label>
            <label className="block text-xs font-semibold text-slate-600">Maximum users <span className="font-normal">(blank = unlimited)</span><input type="number" min="1" step="1" value={edit.users} onChange={event => setPlanEdits(current => ({ ...current, [plan.id]: { ...edit, users: event.target.value } }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"/></label>
            <label className="block text-xs font-semibold text-slate-600">Annual reports <span className="font-normal">(blank = unlimited)</span><input type="number" min="1" step="1" value={edit.reports} onChange={event => setPlanEdits(current => ({ ...current, [plan.id]: { ...edit, reports: event.target.value } }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"/></label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={edit.active} onChange={event => setPlanEdits(current => ({ ...current, [plan.id]: { ...edit, active: event.target.checked } }))}/>Available for assignment</label>
            <button type="button" onClick={() => void savePlan(plan)} disabled={busy === `plan-${plan.id}`} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4"/>{busy === `plan-${plan.id}` ? 'Saving…' : 'Save plan configuration'}</button>
          </>}
        </article>;
      })}
    </section>

    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-800">Hospital subscriptions</div>
      <div className="divide-y divide-slate-100">
        {data.hospitals.map(hospital => {
          const subscription = hospital.subscription;
          return <div key={hospital.tenantId} className="flex flex-wrap items-center justify-between gap-4 px-4 py-4">
            <div className="min-w-56">
              <div className="font-semibold text-slate-900">{hospital.hospitalName}</div>
              {subscription ? <div className="mt-1 text-xs text-slate-500">
                {subscription.plan.name} · {subscription.reportsUsed.toLocaleString()}/{subscription.plan.annualReportLimit?.toLocaleString() ?? '∞'} reports · {subscription.usersCount}/{subscription.plan.maxUsers ?? '∞'} users · {subscription.status.toLowerCase()} until {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </div> : <div className="mt-1 text-xs font-medium text-amber-700">No subscription assigned</div>}
            </div>
            <div className="flex items-center gap-2">
              <select value={selectedPlans[hospital.tenantId] || ''} onChange={event => setSelectedPlans(current => ({ ...current, [hospital.tenantId]: event.target.value }))} className="min-w-44 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800">
                <option value="">Select plan</option>
                {data.plans.filter(plan => plan.isActive).map(plan => <option key={plan.id} value={plan.id}>{plan.name} · ${plan.annualPriceUsd.toLocaleString()}/year</option>)}
              </select>
              <button type="button" onClick={() => void assignPlan(hospital.tenantId)} disabled={!selectedPlans[hospital.tenantId] || busy === `hospital-${hospital.tenantId}`} className="rounded-lg bg-cyan-700 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50">{busy === `hospital-${hospital.tenantId}` ? 'Assigning…' : 'Assign / Renew'}</button>
            </div>
          </div>;
        })}
        {data.hospitals.length === 0 && <p className="p-4 text-sm text-slate-500">Create a hospital before assigning a subscription.</p>}
      </div>
    </section>
  </div>;
}
