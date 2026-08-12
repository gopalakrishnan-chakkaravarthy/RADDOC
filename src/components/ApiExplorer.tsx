import React, { useState } from 'react';
import { ClinicalDocument } from '../types';
import { API_BASE } from '../services/api';
import { Code2, Play, Copy, Check, Terminal, Globe, Server, CheckCircle2 } from 'lucide-react';

interface ApiExplorerProps {
  document: ClinicalDocument;
}

export const ApiExplorer: React.FC<ApiExplorerProps> = ({ document: doc }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<'generate' | 'validate' | 'approve' | 'sign' | 'fhir'>('generate');
  const [activeLang, setActiveLang] = useState<'curl' | 'csharp' | 'python' | 'node'>('curl');
  const [responseOutput, setResponseOutput] = useState<string>('Click "Execute API Request" to see live REST response.');
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState(false);

  const endpoints = [
    { id: 'generate', name: 'POST /api/v1/documents/{id}/generate', desc: 'Trigger 5 Gemini AI Services (Narrative, Impression, Consistency, Missing Info)' },
    { id: 'validate', name: 'POST /api/v1/documents/{id}/validate', desc: 'Run Clinical Schema & Patient Safety Validation Rules' },
    { id: 'approve', name: 'POST /api/v1/documents/{id}/approve', desc: 'Doctor/Radiologist Review & Approval' },
    { id: 'sign', name: 'POST /api/v1/documents/{id}/sign', desc: 'Apply Cryptographic PKI Digital Signature Seal' },
    { id: 'fhir', name: 'GET /api/v1/documents/{id}/fhir', desc: 'Retrieve HL7 FHIR R4 DiagnosticReport Bundle' }
  ];

  const getCodeSnippet = () => {
    const url = `${window.location.origin}${API_BASE}/documents/${doc.id}/${selectedEndpoint}`;

    if (activeLang === 'curl') {
      if (selectedEndpoint === 'fhir') {
        return `curl -X GET "${url}" \\
  -H "Accept: application/fhir+json"`;
      }
      return `curl -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tenantId": "${doc.tenantId}",
    "practitioner": {
      "name": "${doc.practitioner?.name || 'Dr. K. Senthil Kumar, MD'}",
      "registrationNo": "${doc.practitioner?.registrationNo || 'TN-MMC-78412'}"
    }
  }'`;
    }

    if (activeLang === 'csharp') {
      return `using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

public class ChakkraClinicalClient
{
    private static readonly HttpClient client = new HttpClient();

    public async Task ExecuteDocumentWorkflowAsync()
    {
        var url = "${url}";
        var jsonPayload = "{\\"tenantId\\": \\"${doc.tenantId}\\"}";
        var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

        var response = await client.PostAsync(url, content);
        var result = await response.Content.ReadAsStringAsync();
        Console.WriteLine(result);
    }
}`;
    }

    if (activeLang === 'python') {
      return `import requests

url = "${url}"
headers = {"Content-Type": "application/json"}
payload = {
    "tenantId": "${doc.tenantId}",
    "accessionNumber": "${doc.accessionNumber}"
}

response = requests.post(url, json=payload)
print("Status Code:", response.status_code)
print("Response JSON:", response.json())`;
    }

    return `import fetch from 'node-fetch';

async function executeClinicalApi() {
  const url = '${url}';
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantId: '${doc.tenantId}' })
  });
  const data = await response.json();
  console.log(data);
}

executeClinicalApi();`;
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    setResponseOutput('Executing request...');
    try {
      const url = `${API_BASE}/documents/${doc.id}/${selectedEndpoint}`;
      const method = selectedEndpoint === 'fhir' ? 'GET' : 'POST';
      const body = selectedEndpoint === 'fhir' ? undefined : JSON.stringify({
        tenantId: doc.tenantId,
        practitioner: doc.practitioner
      });

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body
      });
      const data = await res.json();
      setResponseOutput(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponseOutput(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Globe className="w-4 h-4" />
            External HMS / RIS / LIS Integration Portal
          </div>
          <h2 className="text-xl font-bold text-white">Developer API Interactive Explorer</h2>
          <p className="text-xs text-slate-400 mt-1">
            Test live REST endpoints, inspect payload responses, and copy C# .NET, Python, Node.js & cURL SDK code snippets.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700 text-xs">
          <Server className="w-4 h-4 text-emerald-400 ml-1" />
          <span className="font-mono text-slate-200">Base URL: /api/v1</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Endpoint Selection List */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Available REST Endpoints</h3>
          <div className="space-y-2">
            {endpoints.map((ep) => (
              <button
                key={ep.id}
                onClick={() => setSelectedEndpoint(ep.id as any)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedEndpoint === ep.id
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 shadow-md ring-1 ring-cyan-500/30'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs">{ep.name.split(' ')[0]}</span>
                  <span className="text-[10px] font-mono text-slate-400">{ep.name.split(' ')[1]}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ep.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Interactive Code Tester & Live Response */}
        <div className="lg:col-span-8 space-y-4">
          {/* Action Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg text-xs font-medium">
              {(['curl', 'csharp', 'python', 'node'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setActiveLang(lang)}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer uppercase text-[11px] font-bold ${
                    activeLang === lang ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang === 'csharp' ? 'C# .NET' : lang}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 cursor-pointer transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Code'}
              </button>

              <button
                onClick={handleExecute}
                disabled={isExecuting}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
              >
                <Play className={`w-3.5 h-3.5 fill-white ${isExecuting ? 'animate-spin' : ''}`} />
                {isExecuting ? 'Running...' : 'Execute API Request'}
              </button>
            </div>
          </div>

          {/* Code Snippet Display */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-cyan-300 overflow-x-auto shadow-inner">
            <pre>{getCodeSnippet()}</pre>
          </div>

          {/* Live Response Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Live Response Output
              </span>
              <span className="text-[10px] text-slate-500 font-mono">HTTP/1.1 200 OK</span>
            </div>

            <div className="p-4 font-mono text-xs text-emerald-400 max-h-[350px] overflow-y-auto">
              <pre className="whitespace-pre">{responseOutput}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
