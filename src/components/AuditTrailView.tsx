import React, { useState, useEffect } from 'react';
import { AuditLogEntry } from '../types';
import { getAuditLogs } from '../services/api';
import { History, ShieldCheck, User, Calendar, RefreshCw } from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <History className="w-4 h-4" />
            Clinical Governance & Audit Engine
          </div>
          <h2 className="text-xl font-bold text-white">Immutable Document Event Audit Trail</h2>
          <p className="text-xs text-slate-400 mt-1">
            Timestamped record tracking creation, AI service prompts, doctor edits, radiologist approvals, and cryptographic signatures.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Logs
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Governance Event Log</h3>
          <span className="text-xs font-semibold text-slate-500">{logs.length} Total Audit Entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Document ID</th>
                <th className="p-3.5">Actor / Service</th>
                <th className="p-3.5">Action Event</th>
                <th className="p-3.5">Audit Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-sans">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-all">
                  <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono font-bold text-cyan-800 whitespace-nowrap">
                    {log.documentId}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-900 whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {log.actor}
                    </span>
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      log.action === 'SIGNED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : log.action === 'APPROVED'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : log.action === 'AI_DRAFT_GENERATED'
                        ? 'bg-purple-100 text-purple-800 border border-purple-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-300'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-600">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
