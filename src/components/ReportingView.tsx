import React, { useEffect, useState } from 'react';
import { ExternalLink, FileSearch, Printer, Receipt, Search } from 'lucide-react';
import { ClinicalDocument, HospitalTenant } from '../types';
import { createInvoice, getInvoices, InvoiceRecord, searchReports, updateInvoice } from '../services/api';

export function ReportingView({ tenant }: { tenant: HospitalTenant | null }) {
  const [section, setSection] = useState<'reports' | 'invoices'>('reports');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [diagnosticType, setDiagnosticType] = useState('');
  const [reports, setReports] = useState<ClinicalDocument[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [amountEdits, setAmountEdits] = useState<Record<string, string>>({});
  const [statusEdits, setStatusEdits] = useState<Record<string, InvoiceRecord['status']>>({});
  const [invoiceFrom, setInvoiceFrom] = useState('');
  const [invoiceTo, setInvoiceTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [invoiceReports, setInvoiceReports] = useState<ClinicalDocument[]>([]);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [creating, setCreating] = useState(false);
  const [invoiceForPrint, setInvoiceForPrint] = useState<InvoiceRecord | null>(null);

  async function openCreateInvoice() {
    setError('');
    try { setInvoiceReports(await searchReports({})); setSelectedReportId(''); setManualAmount(''); setShowCreateInvoice(true); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load reports.'); }
  }

  async function submitManualInvoice(event: React.FormEvent) {
    event.preventDefault(); setCreating(true); setError('');
    try {
      const invoice = await createInvoice(selectedReportId, Number(manualAmount));
      setShowCreateInvoice(false); setInvoiceForPrint(invoice); await loadInvoices();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not create invoice.'); }
    finally { setCreating(false); }
  }

  async function runSearch() {
    setLoading(true); setError('');
    try { setReports(await searchReports({ name, mobile, diagnosticType })); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not search reports.'); }
    finally { setLoading(false); }
  }

  async function loadInvoices() {
    setLoading(true); setError('');
    try { setInvoices(await getInvoices({ from: invoiceFrom, to: invoiceTo })); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load invoices.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (section === 'reports') void runSearch(); else void loadInvoices(); }, [section]);

  async function saveInvoice(invoice: InvoiceRecord) {
    setLoading(true); setError('');
    try {
      await updateInvoice(invoice.id, {
        amount: amountEdits[invoice.id] === undefined ? Number(invoice.amount) : Number(amountEdits[invoice.id]),
        status: statusEdits[invoice.id] || invoice.status
      });
      await loadInvoices();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save invoice.'); setLoading(false); }
  }

  const openReport = (id: string) => window.open(`/reports/${encodeURIComponent(id)}`, '_blank', 'noopener,noreferrer');
  const inputClass = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100';

  return <div className="space-y-5">
    <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-xl">
      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Reports & billing</p>
      <h1 className="mt-1 text-xl font-bold">Reporting</h1>
      <p className="mt-1 text-sm text-slate-400">Search this hospital’s reports and manage invoices created when reports are generated.</p>
    </div>
    <div className="flex gap-2">
      <button onClick={() => setSection('reports')} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${section === 'reports' ? 'bg-cyan-700 text-white' : 'bg-white text-slate-600'}`}><FileSearch size={17}/>Reports</button>
      <button onClick={() => setSection('invoices')} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${section === 'invoices' ? 'bg-cyan-700 text-white' : 'bg-white text-slate-600'}`}><Receipt size={17}/>Invoices</button>
    </div>
    {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

    {section === 'reports' ? <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <form onSubmit={e => { e.preventDefault(); void runSearch(); }} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Patient name" className={inputClass}/>
        <input value={mobile} onChange={e => setMobile(e.target.value)} placeholder="Mobile number" className={inputClass}/>
        <input value={diagnosticType} onChange={e => setDiagnosticType(e.target.value)} placeholder="Diagnostic type or modality" className={inputClass}/>
        <button disabled={loading} className="flex items-center justify-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-600 disabled:opacity-60"><Search size={16}/>{loading ? 'Searching…' : 'Search reports'}</button>
      </form>
      <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-3 py-3">Patient</th><th className="px-3 py-3">Mobile</th><th className="px-3 py-3">Diagnostic type</th><th className="px-3 py-3">Study date</th><th className="px-3 py-3">Status</th><th className="px-3 py-3"></th></tr></thead><tbody className="divide-y divide-slate-100">
        {reports.map(report => <tr key={report.id}><td className="px-3 py-3 font-medium text-slate-800">{report.patient?.name || '—'}<div className="text-xs text-slate-500">{report.patient?.patientId}</div></td><td className="px-3 py-3 text-slate-600">{report.patient?.phone || '—'}</td><td className="px-3 py-3 text-slate-700">{report.templateName} <span className="text-xs text-slate-500">({report.modality})</span></td><td className="px-3 py-3 text-slate-600">{new Date(report.studyDate).toLocaleDateString()}</td><td className="px-3 py-3"><span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{report.status}</span></td><td className="px-3 py-3"><button onClick={() => openReport(report.id)} className="inline-flex items-center gap-1 font-semibold text-cyan-700 hover:text-cyan-900">Open report <ExternalLink size={14}/></button></td></tr>)}
        {!loading && reports.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-500">No reports match these filters.</td></tr>}
      </tbody></table></div>
    </section> : <section className="space-y-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <form onSubmit={event => { event.preventDefault(); void loadInvoices(); }} className="flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold text-slate-600">From<input type="date" value={invoiceFrom} onChange={event => setInvoiceFrom(event.target.value)} className={`${inputClass} mt-1 block`}/></label>
        <label className="text-xs font-semibold text-slate-600">To<input type="date" value={invoiceTo} onChange={event => setInvoiceTo(event.target.value)} className={`${inputClass} mt-1 block`}/></label>
        <button disabled={loading} className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{loading ? 'Loading…' : 'Load invoices'}</button>
        <button type="button" onClick={() => { setInvoiceFrom(''); setInvoiceTo(''); void getInvoices().then(setInvoices).catch(err => setError(err instanceof Error ? err.message : 'Could not load invoices.')); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600">Clear dates</button>
        <button type="button" onClick={() => void openCreateInvoice()} className="ml-auto rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">Create invoice manually</button>
      </form>
      <table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-3 py-3">Invoice</th><th className="px-3 py-3">Patient / report</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Generated</th><th className="px-3 py-3"></th></tr></thead><tbody className="divide-y divide-slate-100">
      {invoices.map(invoice => <tr key={invoice.id}><td className="px-3 py-3 font-mono text-xs text-slate-700">{invoice.invoice_number}</td><td className="px-3 py-3"><div className="font-medium text-slate-800">{invoice.patient_name}</div><button onClick={() => openReport(invoice.document_id)} className="inline-flex items-center gap-1 text-xs text-cyan-700 hover:underline">{invoice.diagnostic_type}<ExternalLink size={12}/></button></td><td className="px-3 py-3"><div className="flex items-center gap-2"><span>{invoice.currency}</span><input aria-label={`Invoice amount ${invoice.invoice_number}`} type="number" min="0" step="0.01" value={amountEdits[invoice.id] ?? String(invoice.amount)} onChange={e => setAmountEdits(current => ({ ...current, [invoice.id]: e.target.value }))} className={`${inputClass} w-28`}/></div></td><td className="px-3 py-3"><select value={statusEdits[invoice.id] || invoice.status} onChange={e => setStatusEdits(current => ({ ...current, [invoice.id]: e.target.value as InvoiceRecord['status'] }))} className={inputClass}><option value="DRAFT">Draft</option><option value="ISSUED">Issued</option><option value="PAID">Paid</option><option value="CANCELLED">Cancelled</option></select></td><td className="px-3 py-3 text-slate-600">{new Date(invoice.created_at).toLocaleDateString()}</td><td className="px-3 py-3"><div className="flex gap-2"><button disabled={loading} onClick={() => void saveInvoice(invoice)} className="rounded-lg bg-cyan-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Save</button><button onClick={() => setInvoiceForPrint(invoice)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"><Printer size={13}/>Print</button></div></td></tr>)}
      {!loading && invoices.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-500">No invoices yet. A draft invoice is created when a report is generated.</td></tr>}
    </tbody></table></section>}
    {showCreateInvoice && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="create-invoice-title"><form onSubmit={event => void submitManualInvoice(event)} className="w-full max-w-xl space-y-4 rounded-2xl bg-white p-6 shadow-2xl"><div><h2 id="create-invoice-title" className="text-lg font-bold text-slate-900">Create invoice manually</h2><p className="mt-1 text-sm text-slate-500">Choose a report from this hospital and enter the invoice amount.</p></div><label className="block text-sm font-semibold text-slate-700">Report<select required value={selectedReportId} onChange={event => setSelectedReportId(event.target.value)} className={`${inputClass} mt-1 block w-full`}><option value="">Select a report</option>{invoiceReports.map(report => <option key={report.id} value={report.id}>{report.patient?.name || 'Patient'} · {report.templateName} · {new Date(report.studyDate).toLocaleDateString()}</option>)}</select></label><label className="block text-sm font-semibold text-slate-700">Amount<input required min="0.01" max="9999999999" step="0.01" type="number" value={manualAmount} onChange={event => setManualAmount(event.target.value)} className={`${inputClass} mt-1 block w-full`}/></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setShowCreateInvoice(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button><button disabled={creating || !selectedReportId} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{creating ? 'Creating…' : 'Create invoice'}</button></div></form></div>}
    {invoiceForPrint && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4 print:static print:overflow-visible print:bg-white print:p-0"><div className="print:hidden mx-auto flex max-w-3xl justify-end gap-2 py-2"><button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white"><Printer size={16}/>Print invoice</button><button onClick={() => setInvoiceForPrint(null)} className="rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold text-white">Close</button></div><article id="printable-invoice" className="mx-auto max-w-3xl space-y-8 rounded-xl bg-white p-10 text-slate-900 shadow-xl print:shadow-none"><header className="flex justify-between gap-8 border-b-2 border-slate-800 pb-6"><div><h1 className="text-2xl font-bold">{tenant?.name || 'Hospital'}</h1><p className="mt-2 whitespace-pre-line text-sm text-slate-600">{tenant?.address}</p><p className="text-sm text-slate-600">{tenant?.phone}{tenant?.email ? ` · ${tenant.email}` : ''}</p></div><div className="text-right"><h2 className="text-3xl font-bold tracking-wider">INVOICE</h2><p className="mt-2 font-mono">{invoiceForPrint.invoice_number}</p><p className="text-sm text-slate-600">{new Date(invoiceForPrint.created_at).toLocaleDateString()}</p></div></header><section className="grid grid-cols-2 gap-8"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Bill to</p><p className="mt-2 text-lg font-semibold">{invoiceForPrint.patient_name}</p><p className="text-sm text-slate-600">{invoiceForPrint.mobile_number || ''}</p></div><div className="text-right"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Status</p><p className="mt-2 font-semibold">{invoiceForPrint.status}</p></div></section><table className="w-full text-left"><thead><tr className="border-y border-slate-300 text-xs uppercase text-slate-500"><th className="py-3">Description</th><th className="py-3 text-right">Amount</th></tr></thead><tbody><tr className="border-b border-slate-200"><td className="py-5">Diagnostic report: {invoiceForPrint.diagnostic_type}</td><td className="py-5 text-right">{invoiceForPrint.currency} {Number(invoiceForPrint.amount).toFixed(2)}</td></tr></tbody><tfoot><tr><td className="py-4 text-right font-bold">Total</td><td className="py-4 text-right text-lg font-bold">{invoiceForPrint.currency} {Number(invoiceForPrint.amount).toFixed(2)}</td></tr></tfoot></table><footer className="border-t border-slate-200 pt-4 text-xs text-slate-500">Thank you.</footer></article></div>}
  </div>;
}
