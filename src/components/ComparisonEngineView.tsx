import React, { useState } from 'react';
import { ClinicalDocument } from '../types';
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Calendar,
  Layers,
  FileText
} from 'lucide-react';

interface ComparisonEngineViewProps {
  currentDocument: ClinicalDocument;
  historicalDocuments: ClinicalDocument[];
  onSelectHistorical: (docId: string) => void;
  onRunComparison: () => void;
  isComparing: boolean;
}

export const ComparisonEngineView: React.FC<ComparisonEngineViewProps> = ({
  currentDocument,
  historicalDocuments = [],
  onSelectHistorical,
  onRunComparison,
  isComparing
}) => {
  const selectedPrevDoc = (historicalDocuments || []).find(d => d.id === currentDocument?.previousDocumentId);

  // Extract keys present in both or either
  const allFieldKeys = Array.from(new Set([
    ...Object.keys(currentDocument.observations || {}),
    ...(selectedPrevDoc ? Object.keys(selectedPrevDoc.observations || {}) : [])
  ]));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs tracking-wider uppercase mb-1">
              <GitCompare className="w-4 h-4" />
              Service 5: Previous Report Comparison Engine
            </div>
            <h2 className="text-xl font-bold text-white">Interval Change & Growth Analytics</h2>
            <p className="text-xs text-slate-400 mt-1">
              Automated measurement delta calculations, percentage growth rate tracking, and trend analysis.
            </p>
          </div>

          <button
            onClick={onRunComparison}
            disabled={!currentDocument.previousDocumentId || isComparing}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-semibold text-xs shadow-lg shadow-cyan-600/20 cursor-pointer transition-all self-start md:self-auto"
          >
            <Sparkles className={`w-4 h-4 ${isComparing ? 'animate-spin' : ''}`} />
            {isComparing ? 'Running AI Comparison...' : 'Run Comparative AI Analysis'}
          </button>
        </div>
      </div>

      {/* Select Historical Study Selector Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Study */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded">
              Current Study (New)
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(currentDocument.studyDate).toLocaleDateString()}
            </span>
          </div>
          <h4 className="font-bold text-slate-900 text-sm">{currentDocument.templateName}</h4>
          <p className="text-xs text-slate-600">Accession: {currentDocument.accessionNumber}</p>
          <p className="text-xs text-slate-600">Patient: {currentDocument?.patient?.name || 'Unknown'} ({currentDocument?.patient?.patientId || '--'})</p>
        </div>

        {/* Historical Study Dropdown Picker */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
              Prior Historical Report
            </span>
            <span className="text-xs text-slate-500 font-medium">Select Baseline</span>
          </div>

          <select
            value={currentDocument.previousDocumentId || ''}
            onChange={(e) => onSelectHistorical(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-none cursor-pointer"
          >
            <option value="">-- Select Prior Report for Baseline Comparison --</option>
            {historicalDocuments.map(doc => (
              <option key={doc.id} value={doc.id}>
                {doc.templateName} - {new Date(doc.studyDate).toLocaleDateString()} ({doc.accessionNumber})
              </option>
            ))}
          </select>

          {selectedPrevDoc ? (
            <div className="text-xs text-slate-600 space-y-1 pt-1">
              <p><span className="font-medium text-slate-700">Baseline Date:</span> {new Date(selectedPrevDoc.studyDate).toLocaleDateString()}</p>
              <p><span className="font-medium text-slate-700">Prior Findings Summary:</span> {selectedPrevDoc.findingsText.substring(0, 100)}...</p>
            </div>
          ) : (
            <p className="text-xs text-amber-700 italic flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Select a prior baseline report above to enable interval comparison calculations.
            </p>
          )}
        </div>
      </div>

      {/* AI Comparative Summary Banner (If generated) */}
      {currentDocument.aiResults?.comparativeAnalysis && (
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-xl p-5 border border-blue-700/50 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            AI Longitudinal Change Summary
          </div>
          <p className="text-xs leading-relaxed text-slate-200">
            {currentDocument.aiResults.comparativeAnalysis.summary}
          </p>
          <div className="space-y-1 pt-1">
            <p className="text-[11px] font-bold text-cyan-300 uppercase">Key Interval Highlights:</p>
            <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
              {currentDocument.aiResults.comparativeAnalysis.keyChanges.map((change, idx) => (
                <li key={idx}>{change}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Numerical Measurements Interval Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-600" />
            Atomic Measurement Delta Breakdown
          </h3>
          <span className="text-xs text-slate-500">{allFieldKeys.length} Parameters Evaluated</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                <th className="p-3.5">Clinical Parameter</th>
                <th className="p-3.5">Prior Study ({selectedPrevDoc ? new Date(selectedPrevDoc.studyDate).toLocaleDateString() : 'N/A'})</th>
                <th className="p-3.5">Current Study ({new Date(currentDocument.studyDate).toLocaleDateString()})</th>
                <th className="p-3.5">Absolute Delta</th>
                <th className="p-3.5">Growth Rate (%)</th>
                <th className="p-3.5">Trend Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {allFieldKeys.map(key => {
                const curObs = currentDocument.observations[key];
                const prevObs = selectedPrevDoc?.observations[key];

                const curVal = curObs?.value;
                const prevVal = prevObs?.value;
                const unit = curObs?.unit || prevObs?.unit || '';

                const isNumeric = typeof curVal === 'number' && typeof prevVal === 'number';
                let delta: number | null = null;
                let pct: number | null = null;

                if (isNumeric) {
                  delta = Math.round((curVal - prevVal) * 100) / 100;
                  pct = prevVal !== 0 ? Math.round((delta / prevVal) * 1000) / 10 : 0;
                }

                let trendBadge = <span className="text-slate-400 font-medium">Stable / Same</span>;
                if (isNumeric && delta !== null) {
                  if (delta > 0) {
                    trendBadge = (
                      <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded font-bold">
                        <TrendingUp className="w-3 h-3" /> Increased (+{delta} {unit})
                      </span>
                    );
                  } else if (delta < 0) {
                    trendBadge = (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                        <TrendingDown className="w-3 h-3" /> Decreased ({delta} {unit})
                      </span>
                    );
                  }
                } else if (curVal !== prevVal) {
                  trendBadge = (
                    <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-bold">
                      Changed
                    </span>
                  );
                }

                return (
                  <tr key={key} className="hover:bg-slate-50/80 transition-all">
                    <td className="p-3.5 font-semibold text-slate-900 capitalize">
                      {key.replace(/_/g, ' ')}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {prevVal !== undefined ? `${prevVal} ${unit}` : <span className="text-slate-400 italic">N/A</span>}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      {curVal !== undefined ? `${curVal} ${unit}` : <span className="text-slate-400 italic">N/A</span>}
                    </td>
                    <td className="p-3.5 font-mono">
                      {isNumeric && delta !== null ? (
                        <span className={delta > 0 ? 'text-red-600 font-bold' : delta < 0 ? 'text-emerald-600 font-bold' : 'text-slate-500'}>
                          {delta > 0 ? `+${delta}` : delta} {unit}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono">
                      {isNumeric && pct !== null ? (
                        <span className={pct > 0 ? 'text-red-600 font-bold' : pct < 0 ? 'text-emerald-600 font-bold' : 'text-slate-500'}>
                          {pct > 0 ? `+${pct}%` : `${pct}%`}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {trendBadge}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
