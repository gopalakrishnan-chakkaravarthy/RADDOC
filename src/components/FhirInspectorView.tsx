import React, { useState, useEffect } from 'react';
import { ClinicalDocument } from '../types';
import { getFHIRBundle } from '../services/api';
import { FileCode, Copy, Check, ShieldCheck, Download, Layers } from 'lucide-react';

interface FhirInspectorViewProps {
  document: ClinicalDocument;
}

export const FhirInspectorView: React.FC<FhirInspectorViewProps> = ({ document: doc }) => {
  const [fhirData, setFhirData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFHIR() {
      setLoading(true);
      try {
        const bundle = await getFHIRBundle(doc.id);
        setFhirData(bundle);
      } catch (err) {
        console.error('FHIR load failed', err);
      } finally {
        setLoading(false);
      }
    }
    loadFHIR();
  }, [doc.id]);

  const handleCopy = () => {
    if (fhirData) {
      navigator.clipboard.writeText(JSON.stringify(fhirData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (fhirData) {
      const blob = new Blob([JSON.stringify(fhirData, null, 2)], { type: 'application/fhir+json' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `FHIR-DiagnosticReport-${doc.id}.json`;
      a.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            HL7 FHIR R4 Interoperability & DICOM SR Model
          </div>
          <h2 className="text-xl font-bold text-white">Interoperable Clinical JSON Inspector</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time DiagnosticReport & Observation FHIR R4 resources structured for hospital interoperability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied FHIR JSON' : 'Copy FHIR JSON'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
          >
            <Download className="w-4 h-4" />
            Export FHIR Bundle (.json)
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-1">
          <span className="text-slate-500 font-semibold uppercase text-[10px]">FHIR Resource Type</span>
          <p className="font-bold text-slate-900 text-sm">Bundle (type: collection)</p>
          <p className="text-slate-500 text-[11px]">Includes DiagnosticReport, Patient & Observations</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-1">
          <span className="text-slate-500 font-semibold uppercase text-[10px]">Coding Standard</span>
          <p className="font-bold text-slate-900 text-sm">LOINC 24725-4 (Radiology)</p>
          <p className="text-slate-500 text-[11px]">System: http://loinc.org</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-1">
          <span className="text-slate-500 font-semibold uppercase text-[10px]">Atomic Observations</span>
          <p className="font-bold text-emerald-600 text-sm">{Object.keys(doc.observations).length} FHIR Observations</p>
          <p className="text-slate-500 text-[11px]">Structured numeric & categorical results</p>
        </div>
      </div>

      {/* Code Editor Container */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span>DiagnosticReport-{doc.id}.fhir.json</span>
          </div>
          <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded font-mono border border-slate-700">
            Validated FHIR R4 Schema
          </span>
        </div>

        <div className="p-6 font-mono text-xs overflow-x-auto max-h-[600px] text-cyan-300">
          {loading ? (
            <div className="text-slate-400 animate-pulse">Generating FHIR R4 resources...</div>
          ) : (
            <pre className="whitespace-pre">{JSON.stringify(fhirData, null, 2)}</pre>
          )}
        </div>
      </div>
    </div>
  );
};
