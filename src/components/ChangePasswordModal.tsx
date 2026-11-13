import React, { FormEvent, useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import { changePassword } from '../services/api';

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (newPassword.length < 10 || newPassword.length > 128) { setError('Use a password between 10 and 128 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('New password and confirmation do not match.'); return; }
    setSaving(true);
    try { await changePassword(currentPassword, newPassword); setSaved(true); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not change password.'); }
    finally { setSaving(false); }
  }

  const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100';
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="change-password-title">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
      <div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2"><KeyRound className="text-cyan-700" size={20}/><h2 id="change-password-title" className="text-lg font-bold text-slate-900">Change password</h2></div><button onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18}/></button></div>
      {saved ? <div><p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Password changed successfully.</p><button onClick={onClose} className="mt-5 w-full rounded-lg bg-cyan-700 px-4 py-2.5 font-semibold text-white">Done</button></div> : <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">Current password<input autoComplete="current-password" type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={inputClass}/></label>
        <label className="block text-sm font-medium text-slate-700">New password<input autoComplete="new-password" type="password" minLength={10} maxLength={128} required value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass}/><span className="mt-1 block text-xs text-slate-500">At least 10 characters.</span></label>
        <label className="block text-sm font-medium text-slate-700">Confirm new password<input autoComplete="new-password" type="password" minLength={10} maxLength={128} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass}/></label>
        {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button disabled={saving} className="rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Update password'}</button></div>
      </form>}
    </div>
  </div>;
}
