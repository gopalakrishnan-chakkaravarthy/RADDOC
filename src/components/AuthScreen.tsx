import React, { FormEvent, useState } from 'react';
import { Activity, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { AuthUser, login, signup } from '../services/api';

export function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = mode === 'signup' ? await signup(name, email, password) : await login(email, password);
      onAuthenticated(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to authenticate. Please try again.');
    } finally { setSubmitting(false); }
  }

  return <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10 text-slate-100">
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/40"><Activity size={30} /></div>
        <h1 className="text-2xl font-bold tracking-tight">Chakkra <span className="text-emerald-400">RADDOC</span></h1>
        <p className="mt-2 text-sm text-slate-400">Clinical document intelligence</p>
      </div>
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
        <div className="mb-6"><h2 className="text-xl font-semibold">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2><p className="mt-1 text-sm text-slate-400">{mode === 'login' ? 'Sign in to continue to your workspace.' : 'Create an account to access the clinical workspace.'}</p></div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && <label className="block text-sm font-medium text-slate-300">Full name<div className="relative mt-1.5"><UserRound size={17} className="absolute left-3 top-3 text-slate-500"/><input autoComplete="name" required minLength={2} maxLength={255} value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 outline-none focus:border-emerald-500" placeholder="Your name" /></div></label>}
          <label className="block text-sm font-medium text-slate-300">Email<div className="relative mt-1.5"><Mail size={17} className="absolute left-3 top-3 text-slate-500"/><input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 outline-none focus:border-emerald-500" placeholder="you@example.com" /></div></label>
          <label className="block text-sm font-medium text-slate-300">Password<div className="relative mt-1.5"><LockKeyhole size={17} className="absolute left-3 top-3 text-slate-500"/><input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'signup' ? 10 : undefined} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-11 outline-none focus:border-emerald-500" placeholder={mode === 'signup' ? 'At least 10 characters' : 'Your password'} /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-200">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>
          {error && <div role="alert" className="rounded-lg border border-rose-900 bg-rose-950/60 px-3 py-2.5 text-sm text-rose-200">{error}</div>}
          <button disabled={submitting} className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60">{submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">{mode === 'login' ? 'New to RADDOC?' : 'Already have an account?'}{' '}<button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }} className="font-semibold text-emerald-400 hover:text-emerald-300">{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
      </section>
      <p className="mt-5 text-center text-xs text-slate-600">Secure access to your clinical workspace</p>
    </div>
  </div>;
}
