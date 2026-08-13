import React, { useState } from 'react';
import { ClinicalDocument, TemplateDefinition, Patient, HospitalTenant } from '../types';
import { createDocument, createPatient } from '../services/api';
import { Layers, Plus, Stethoscope, Search, Calendar, ChevronRight, User, ShieldCheck } from 'lucide-react';

interface ClinicalQueueProps {
  documents: ClinicalDocument[];
  templates: TemplateDefinition[];
  patients: Patient[];
  tenant: HospitalTenant;
  activeDocId: string;
  onSelectDocument: (doc: ClinicalDocument) => void;
  onDocumentCreated: (doc: ClinicalDocument) => void;
}

export const ClinicalQueue: React.FC<ClinicalQueueProps> = ({
  documents = [],
  templates = [],
  patients = [],
  tenant,
  activeDocId,
  onSelectDocument,
  onDocumentCreated
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || 'usg-abdomen');
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [patientMode, setPatientMode] = useState<'existing' | 'new'>('existing');
  
  // New Patient Form State
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientAge, setNewPatientAge] = useState<number | ''>(45);
  const [newPatientGender, setNewPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientDob, setNewPatientDob] = useState('');
  
  const [isCreating, setIsCreating] = useState(false);

  const filteredDocs = (documents || []).filter(d =>
    (d.patient?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.templateName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.accessionNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const template = templates.find(t => t.id === selectedTemplateId) || templates[0];
      
      let patient: Patient;
      if (patientMode === 'new') {
        const createdPatient = await createPatient({
          patientId: `PAT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          name: newPatientName.trim() || 'New Patient',
          age: typeof newPatientAge === 'number' ? newPatientAge : 40,
          gender: newPatientGender,
          phone: newPatientPhone.trim() || undefined,
          dob: newPatientDob || undefined
        });
        patient = createdPatient;
      } else {
        patient = patients.find(p => p.id === selectedPatientId) || patients[0];
      }

      // Build default observation object from template fields
      const defaultObs: Record<string, any> = {};
      template.fields.forEach(f => {
        defaultObs[f.id] = {
          value: f.defaultValue,
          unit: f.unit
        };
      });

      const newDoc = await createDocument({
        tenantId: tenant.id,
        patient,
        templateId: template.id,
        templateName: template.name,
        modality: template.modality,
        observations: defaultObs,
        accessionNumber: `ACC-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        referringPhysician: 'Dr. V. Ramanathan, MD (Gen Med)'
      });

      onDocumentCreated(newDoc);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            Hospital Worklist & RIS Queue
          </div>
          <h2 className="text-xl font-bold text-white">Clinical Diagnostic Studies Queue</h2>
          <p className="text-xs text-slate-400 mt-1">
            Active diagnostic studies for {tenant?.name || 'Selected Facility'}. Create new structured reports across 20+ specialized radiology templates.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patient, accession, or study..."
            className="bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List: Active Worklist Documents */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
            <span>ACTIVE CLINICAL REPORTS ({filteredDocs.length})</span>
            <span>STATUS & ACCESSSION</span>
          </div>

          <div className="space-y-3">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  doc.id === activeDocId
                    ? 'bg-cyan-950/60 border-cyan-500 shadow-md ring-1 ring-cyan-500/30 text-white'
                    : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs ${
                    doc.id === activeDocId ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-cyan-800 border border-slate-200'
                  }`}>
                    {doc.modality}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{doc.templateName}</h4>
                    <p className="text-xs opacity-80 mt-0.5">
                      Patient: <span className="font-semibold">{doc.patient?.name || 'Unknown Patient'}</span> ({doc.patient?.patientId || '--'})
                    </p>
                    <p className="text-[11px] opacity-60">
                      Study Date: {new Date(doc.studyDate).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    doc.status === 'DIGITALLY_SIGNED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                    doc.status === 'APPROVED' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                    'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {doc.status}
                  </span>
                  <p className="font-mono text-xs opacity-75">{doc.accessionNumber}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Card: Order New Study Form */}
        <div className="lg:col-span-4">
          <form onSubmit={handleCreateNew} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 text-xs">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-600" />
                Order & Create New Structured Study
              </h3>
              <p className="text-slate-500 mt-0.5">Initialize structured clinical schema for new patient study.</p>
            </div>

            {/* Patient Mode Tabs */}
            <div className="space-y-2">
              <label className="font-bold text-slate-800 block">Patient Selection</label>
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPatientMode('existing')}
                  className={`py-1.5 text-center font-bold text-xs rounded-lg cursor-pointer transition-all ${
                    patientMode === 'existing'
                      ? 'bg-white text-cyan-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Existing Patient
                </button>
                <button
                  type="button"
                  onClick={() => setPatientMode('new')}
                  className={`py-1.5 text-center font-bold text-xs rounded-lg cursor-pointer transition-all ${
                    patientMode === 'new'
                      ? 'bg-white text-cyan-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  + Register New
                </button>
              </div>
            </div>

            {patientMode === 'existing' ? (
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">Select Patient</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none cursor-pointer"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {p.patientId} ({p.age}Y/{p.gender})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Patient Name *</label>
                  <input
                    type="text"
                    required
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    placeholder="e.g. Anitha Sundar"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 block">Age (Yrs) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="120"
                      value={newPatientAge}
                      onChange={(e) => setNewPatientAge(e.target.value ? parseInt(e.target.value, 10) : '')}
                      placeholder="e.g. 35"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 block">Gender *</label>
                    <select
                      value={newPatientGender}
                      onChange={(e) => setNewPatientGender(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Contact Number / Phone</label>
                  <input
                    type="tel"
                    value={newPatientPhone}
                    onChange={(e) => setNewPatientPhone(e.target.value)}
                    placeholder="+91 98400 12345"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Date of Birth (DOB)</label>
                  <input
                    type="date"
                    value={newPatientDob}
                    onChange={(e) => setNewPatientDob(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Select Modality Template (20+ Available)</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none cursor-pointer"
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    [{t.modality}] {t.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white p-3 rounded-xl font-bold text-xs shadow-lg shadow-cyan-600/20 cursor-pointer transition-all"
            >
              <Stethoscope className="w-4 h-4" />
              {isCreating ? 'Creating Study...' : 'Initialize Structured Study'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
