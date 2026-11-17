import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ClinicalDocument, TemplateDefinition, Patient } from '../types';
import { createDocument, createPatient, getCurrentSubscription, getTenants } from '../services/api';
import { AppDispatch, RootState } from '../store';
import { setCurrentSubscription, setCurrentTenant } from '../store/tenantSlice';
import { Layers, Plus, Stethoscope, Search, Calendar, ChevronRight, User, ShieldCheck } from 'lucide-react';

interface ClinicalQueueProps {
  documents: ClinicalDocument[];
  templates: TemplateDefinition[];
  patients: Patient[];
  activeDocId: string;
  onSelectDocument: (doc: ClinicalDocument) => void;
  onDocumentCreated: (doc: ClinicalDocument) => void;
}

export const ClinicalQueue: React.FC<ClinicalQueueProps> = ({
  documents = [],
  templates = [],
  patients = [],
  activeDocId,
  onSelectDocument,
  onDocumentCreated
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const tenant = useSelector((state: RootState) => state.tenant.currentTenant);
  const subscription = useSelector((state: RootState) => state.tenant.subscription);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || 'usg-abdomen');
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [patientMode, setPatientMode] = useState<'existing' | 'new'>('existing');
  
  // New Patient Form State
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientGender, setNewPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientDob, setNewPatientDob] = useState('');

  const today = new Date();
  const maxDob = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const earliestDobDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
  const minDob = `${earliestDobDate.getFullYear()}-${String(earliestDobDate.getMonth() + 1).padStart(2, '0')}-${String(earliestDobDate.getDate()).padStart(2, '0')}`;
  const calculateAgeInYears = (dob: string) => {
    if (!dob) return 0;
    const [year, month, day] = dob.split('-').map(Number);
    let age = today.getFullYear() - year;
    if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age -= 1;
    return age;
  };
  const calculateAgeDisplay = (dob: string) => {
    if (!dob) return '';
    const [year, month, day] = dob.split('-').map(Number);
    let months = (today.getFullYear() - year) * 12 + today.getMonth() + 1 - month;
    if (today.getDate() < day) months -= 1;
    if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'}`;
    const years = calculateAgeInYears(dob);
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  };
  const newPatientAge = calculateAgeDisplay(newPatientDob);
  
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingTenant, setIsLoadingTenant] = useState(!tenant);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (tenant) {
      setIsLoadingTenant(false);
      return;
    }

    let cancelled = false;
    setIsLoadingTenant(true);
    getTenants().then(availableTenants => {
      if (cancelled) return;
      const assignedTenant = availableTenants[0];
      if (assignedTenant) {
        dispatch(setCurrentTenant(assignedTenant));
        setFormError('');
      } else {
        setFormError('No hospital was returned for this account. Confirm the hospital assignment in System Admin, then sign in again.');
      }
    }).catch(err => {
      if (!cancelled) setFormError(err instanceof Error ? err.message : 'Could not load the hospital assigned to this account.');
    }).finally(() => {
      if (!cancelled) setIsLoadingTenant(false);
    });

    return () => { cancelled = true; };
  }, [tenant, dispatch]);

  useEffect(() => {
    let cancelled = false;
    getCurrentSubscription().then(currentSubscription => {
      if (cancelled) return;
      dispatch(setCurrentSubscription(currentSubscription));
      if (!currentSubscription) setFormError('No subscription plan is assigned to this hospital. Contact the system administrator.');
    }).catch(err => {
      if (!cancelled) setFormError(err instanceof Error ? err.message : 'Could not load the hospital subscription.');
    }).finally(() => {
      if (!cancelled) setIsLoadingSubscription(false);
    });
    return () => { cancelled = true; };
  }, [dispatch]);

  const filteredDocs = (documents || []).filter(d =>
    (d.patient?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.templateName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.accessionNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (patientMode === 'new' && (!newPatientDob || newPatientDob < minDob || newPatientDob > maxDob)) return;
    if (!subscription) {
      setFormError('No subscription plan is assigned to this hospital. Contact the system administrator.');
      return;
    }
    if (subscription.status !== 'ACTIVE') {
      setFormError('The hospital subscription is expired or inactive. Contact the system administrator to renew it.');
      return;
    }
    if (subscription.plan.annualReportLimit !== null && subscription.reportsUsed >= subscription.plan.annualReportLimit) {
      setFormError(`This hospital has reached its annual limit of ${subscription.plan.annualReportLimit.toLocaleString()} reports. Upgrade or renew the subscription to create more reports.`);
      return;
    }
    const template = templates.find(t => t.id === selectedTemplateId) || templates[0];
    if (!tenant) {
      setFormError('No hospital is selected for this account. Ask an administrator to assign a hospital before creating a study.');
      return;
    }
    if (!template) {
      setFormError('No study templates are available. Ask an administrator to configure templates before creating a study.');
      return;
    }
    const selectedPatient = patientMode === 'existing'
      ? patients.find(p => p.id === selectedPatientId) || patients[0]
      : undefined;
    if (patientMode === 'existing' && !selectedPatient) {
      setFormError('Select an existing patient or register a new patient first.');
      return;
    }
    setIsCreating(true);
    try {
      let patient: Patient;
      if (patientMode === 'new') {
        const createdPatient = await createPatient({
          patientId: `PAT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          name: newPatientName.trim() || 'New Patient',
          age: calculateAgeInYears(newPatientDob),
          gender: newPatientGender,
          phone: newPatientPhone.trim() || undefined,
          dob: newPatientDob || undefined
        });
        patient = createdPatient;
      } else {
        patient = selectedPatient!;
      }

      // Build default observation object from template fields
      const defaultObs: Record<string, any> = {};
      template.fields.forEach(f => {
        defaultObs[f.id] = {
          value: f.defaultValue,
          unit: f.unit
        };
      });

      const { document: newDoc, subscription } = await createDocument({
        tenantId: tenant.id,
        patient,
        templateId: template.id,
        templateName: template.name,
        modality: template.modality,
        observations: defaultObs,
        accessionNumber: `ACC-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        referringPhysician: 'Dr. V. Ramanathan, MD (Gen Med)'
      });

      dispatch(setCurrentSubscription(subscription));
      onDocumentCreated(newDoc);
    } catch (err) {
      console.error(err);
      setFormError(err instanceof Error ? err.message : 'Could not create the study.');
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

            {formError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700">{formError}</p>}
            {subscription && <p className="rounded-lg bg-cyan-50 px-3 py-2 text-cyan-900">Plan: <strong>{subscription.plan.name}</strong> · {subscription.reportsUsed.toLocaleString()}/{subscription.plan.annualReportLimit?.toLocaleString() ?? '∞'} annual reports</p>}

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

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Date of Birth (DOB) *</label>
                  <input
                    type="date"
                    required
                    min={minDob}
                    max={maxDob}
                    value={newPatientDob}
                    onChange={(e) => setNewPatientDob(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 block">Age (Yrs)</label>
                    <input
                      type="text"
                      readOnly
                      value={newPatientAge}
                      placeholder="Calculated from DOB"
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
              disabled={isCreating || isLoadingTenant || isLoadingSubscription || !tenant || !subscription}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white p-3 rounded-xl font-bold text-xs shadow-lg shadow-cyan-600/20 cursor-pointer transition-all disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Stethoscope className="w-4 h-4" />
              {isLoadingTenant || isLoadingSubscription ? 'Loading Subscription...' : isCreating ? 'Creating Study...' : 'Initialize Structured Study'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
