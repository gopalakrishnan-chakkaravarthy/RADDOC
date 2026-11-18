import React, { useState } from 'react';
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { FieldDefinition, Modality, TemplateDefinition } from '../types';
import { deleteTemplate, saveTemplate } from '../services/api';

const modalities: Modality[] = ['USG', 'X-RAY', 'CT', 'MRI', 'MAMMOGRAPHY', 'ECHO'];
const emptyTemplate = (): TemplateDefinition => ({ id: '', name: '', modality: 'USG', category: '', description: '', fields: [] });

export function TemplateManagement({ templates, onChanged }: { templates: TemplateDefinition[]; onChanged: (templates: TemplateDefinition[]) => void }) {
  const [draft, setDraft] = useState<TemplateDefinition | null>(null);
  const [fieldsJson, setFieldsJson] = useState('[]');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function edit(template: TemplateDefinition) {
    setDraft({ ...template });
    setFieldsJson(JSON.stringify(template.fields, null, 2));
    setError('');
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setError('');
    let fields: FieldDefinition[];
    try {
      fields = JSON.parse(fieldsJson);
      if (!Array.isArray(fields)) throw new Error('Fields must be a JSON array.');
      if (fields.some(field => !field.id || !field.label || !field.category || !['number', 'select', 'text', 'boolean'].includes(field.type))) throw new Error('Each field needs an id, label, category, and valid type.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Fields JSON is invalid.'); return; }
    setBusy(true);
    try {
      const saved = await saveTemplate({ ...draft, fields });
      onChanged([...templates.filter(template => template.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name)));
      setDraft(null);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save template.'); }
    finally { setBusy(false); }
  }

  async function remove(template: TemplateDefinition) {
    if (!window.confirm(`Delete template “${template.name}”?`)) return;
    setError(''); setBusy(true);
    try { await deleteTemplate(template.id); onChanged(templates.filter(item => item.id !== template.id)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not delete template.'); }
    finally { setBusy(false); }
  }

  return <section className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-900">Template management</h2><p className="mt-1 text-sm text-slate-500">Create and maintain diagnostic templates and their structured report fields.</p></div><button type="button" onClick={() => edit(emptyTemplate())} className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-600"><Plus size={16}/>New template</button></div>
    {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    {draft && <form onSubmit={event => void submit(event)} className="space-y-4 rounded-xl border border-cyan-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between"><h3 className="font-bold text-slate-900">{draft.id ? 'Edit template' : 'Create template'}</h3><button type="button" onClick={() => setDraft(null)} className="rounded p-1 text-slate-500 hover:bg-slate-100" aria-label="Close editor"><X size={18}/></button></div>
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Template ID<input required pattern="[A-Za-z0-9_-]+" disabled={templates.some(template => template.id === draft.id)} value={draft.id} onChange={e => setDraft({ ...draft, id: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" placeholder="ct-chest"/></label><label className="text-sm font-semibold text-slate-700">Name<input required value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"/></label><label className="text-sm font-semibold text-slate-700">Modality<select value={draft.modality} onChange={e => setDraft({ ...draft, modality: e.target.value as Modality })} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal">{modalities.map(modality => <option key={modality}>{modality}</option>)}</select></label><label className="text-sm font-semibold text-slate-700">Category<input value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"/></label><label className="text-sm font-semibold text-slate-700 sm:col-span-2">Description<textarea rows={2} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"/></label></div>
      <label className="block text-sm font-semibold text-slate-700">Structured fields <span className="font-normal text-slate-500">(JSON array)</span><textarea required rows={12} value={fieldsJson} onChange={e => setFieldsJson(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs font-normal" placeholder={'[{"id":"finding","label":"Finding","type":"text","category":"General"}]'}/></label>
      <div className="flex justify-end"><button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Save size={15}/>{busy ? 'Saving…' : 'Save template'}</button></div>
    </form>}
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="grid grid-cols-[1fr_auto] gap-3 border-b bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"><span>{templates.length} templates</span><span>Actions</span></div><div className="divide-y divide-slate-100">{templates.map(template => <div key={template.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><div><div className="font-semibold text-slate-800">{template.name}</div><div className="text-xs text-slate-500">{template.id} · {template.modality} · {template.fields.length} fields</div></div><div className="flex gap-2"><button type="button" disabled={busy} onClick={() => edit(template)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Pencil size={14}/>Edit</button><button type="button" disabled={busy} onClick={() => void remove(template)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"><Trash2 size={14}/>Delete</button></div></div>)}{templates.length === 0 && <p className="p-5 text-sm text-slate-500">No templates configured.</p>}</div></div>
  </section>;
}
