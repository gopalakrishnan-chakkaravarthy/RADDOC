import React, { useState, useEffect } from 'react';
import { HospitalTenant, Practitioner } from '../types';
import { Building2, Save, Check, Shield, Image, Mail, Phone, MapPin, BadgeCheck, Stethoscope, Plus, Database, Loader2 } from 'lucide-react';
import { DoctorManagementForm } from './DoctorManagementForm';

interface HospitalSettingsProps {
  tenant: HospitalTenant;
  tenants?: HospitalTenant[];
  onSelectTenant?: (tenant: HospitalTenant) => void;
  practitioners: Practitioner[];
  onUpdateTenant: (updated: HospitalTenant) => Promise<void>;
  onAddTenant?: (newTenant: Partial<HospitalTenant>) => Promise<void>;
  onAddPractitioner: (doctor: Partial<Practitioner>) => Promise<void>;
  onUpdatePractitioner: (id: string, updated: Partial<Practitioner>) => Promise<void>;
  onDeletePractitioner: (id: string) => Promise<void>;
}

export const HospitalSettings: React.FC<HospitalSettingsProps> = ({
  tenant,
  tenants = [],
  onSelectTenant,
  practitioners = [],
  onUpdateTenant,
  onAddTenant,
  onAddPractitioner,
  onUpdatePractitioner,
  onDeletePractitioner
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'branding' | 'doctors'>('branding');
  const [form, setForm] = useState<HospitalTenant>({ ...tenant });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // New Hospital Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHospitalName, setNewHospitalName] = useState('');
  const [newHospitalCode, setNewHospitalCode] = useState('');
  const [newHospitalHeader, setNewHospitalHeader] = useState('');
  const [newHospitalDept, setNewHospitalDept] = useState('Department of Radio-Diagnosis & Imaging');
  const [newHospitalPhone, setNewHospitalPhone] = useState('');
  const [newHospitalEmail, setNewHospitalEmail] = useState('');
  const [newHospitalAddress, setNewHospitalAddress] = useState('');
  const [newHospitalAccreditation, setNewHospitalAccreditation] = useState('NABH & NABL Accredited');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (tenant) {
      setForm({ ...tenant });
    }
  }, [tenant]);

  const handleChange = (field: keyof HospitalTenant, val: string) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateTenant(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save hospital settings to database:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHospitalName.trim() || !newHospitalCode.trim()) return;
    setIsAdding(true);
    try {
      const payload: Partial<HospitalTenant> = {
        name: newHospitalName.trim(),
        code: newHospitalCode.trim().toUpperCase(),
        headerTitle: newHospitalHeader.trim() || newHospitalName.trim(),
        department: newHospitalDept.trim(),
        phone: newHospitalPhone.trim(),
        email: newHospitalEmail.trim(),
        address: newHospitalAddress.trim(),
        accreditation: newHospitalAccreditation.trim(),
        logoUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=150'
      };

      if (onAddTenant) {
        await onAddTenant(payload);
      }

      setShowAddModal(false);
      setNewHospitalName('');
      setNewHospitalCode('');
      setNewHospitalHeader('');
      setNewHospitalPhone('');
      setNewHospitalEmail('');
      setNewHospitalAddress('');
    } catch (err) {
      console.error('Failed to add new hospital to database:', err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Sub Tab Navigation Header & Hospital Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('branding')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeSubTab === 'branding'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Hospital Branding & Facility Header</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('doctors')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeSubTab === 'doctors'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Doctors & Radiologists Directory</span>
            <span className="ml-1 bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full text-[10px]">
              {practitioners.length}
            </span>
          </button>
        </div>

        {/* Database Hospital Selector Dropdown */}
        {tenants.length > 0 && onSelectTenant && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white">
              <Database className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-slate-400 text-[11px] font-semibold">Active DB Hospital:</span>
              <select
                value={tenant?.id || ''}
                onChange={(e) => {
                  const selected = tenants.find(t => t.id === e.target.value);
                  if (selected && onSelectTenant) {
                    onSelectTenant(selected);
                  }
                }}
                className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer"
              >
                {tenants.map(t => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
              title="Add New Hospital Facility to Database"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Hospital</span>
            </button>
          </div>
        )}
      </div>

      {/* Sub Tab Content */}
      {activeSubTab === 'branding' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider mb-1">
                <Building2 className="w-4 h-4" />
                Multi-Tenant PostgreSQL Hospital Database Configuration
              </div>
              <h2 className="text-xl font-bold text-white">Hospital Branding & Header Settings ({form.name})</h2>
              <p className="text-xs text-slate-400 mt-1">
                All settings below are fetched directly from and saved to the PostgreSQL database (<span className="text-purple-400 font-mono">tenants</span> table).
              </p>
            </div>

            {saved && (
              <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3 py-2 rounded-xl text-xs font-semibold animate-fade-in">
                <Check className="w-4 h-4" />
                Saved to PostgreSQL DB
              </div>
            )}
          </div>

          {/* Form Container */}
          <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-cyan-600" />
                  Hospital Legal Name
                </label>
                <input
                  type="text"
                  value={form.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-semibold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-cyan-600" />
                  Facility Tenant Code
                </label>
                <input
                  type="text"
                  value={form.code || ''}
                  onChange={(e) => handleChange('code', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono font-semibold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-cyan-600" />
                  Official Report Header Title
                </label>
                <input
                  type="text"
                  value={form.headerTitle || ''}
                  onChange={(e) => handleChange('headerTitle', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-semibold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-cyan-600" />
                  Department Name
                </label>
                <input
                  type="text"
                  value={form.department || ''}
                  onChange={(e) => handleChange('department', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-semibold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  placeholder="e.g. Department of Radio-Diagnosis & Imaging"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Image className="w-4 h-4 text-cyan-600" />
                  Hospital Logo URL
                </label>
                <input
                  type="text"
                  value={form.logoUrl || ''}
                  onChange={(e) => handleChange('logoUrl', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-cyan-600" />
                  Accreditation Banner Text
                </label>
                <input
                  type="text"
                  value={form.accreditation || ''}
                  onChange={(e) => handleChange('accreditation', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-semibold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-cyan-600" />
                  Full Address
                </label>
                <input
                  type="text"
                  value={form.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-cyan-600" />
                  Department Phone
                </label>
                <input
                  type="text"
                  value={form.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-cyan-600" />
                  Department Email
                </label>
                <input
                  type="text"
                  value={form.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-purple-600" />
                <span>Connected to PostgreSQL DB (<span className="font-mono">tenants</span> table)</span>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-cyan-600/20 cursor-pointer transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to DB...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Hospital Branding to DB</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeSubTab === 'doctors' && (
        <div className="animate-fade-in">
          <DoctorManagementForm
            practitioners={practitioners}
            onAddPractitioner={onAddPractitioner}
            onUpdatePractitioner={onUpdatePractitioner}
            onDeletePractitioner={onDeletePractitioner}
          />
        </div>
      )}

      {/* Add New Hospital Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Building2 className="w-5 h-5" />
                Add New Hospital Facility
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateHospital} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Hospital Legal Name *</label>
                <input
                  type="text"
                  value={newHospitalName}
                  onChange={(e) => setNewHospitalName(e.target.value)}
                  placeholder="e.g. Apollo Diagnostics & Imaging Center"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tenant Code *</label>
                  <input
                    type="text"
                    value={newHospitalCode}
                    onChange={(e) => setNewHospitalCode(e.target.value)}
                    placeholder="e.g. APOLLO-HYD"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={newHospitalPhone}
                    onChange={(e) => setNewHospitalPhone(e.target.value)}
                    placeholder="+91 40 2360 7777"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Report Header Title</label>
                <input
                  type="text"
                  value={newHospitalHeader}
                  onChange={(e) => setNewHospitalHeader(e.target.value)}
                  placeholder="e.g. Apollo Advanced Radiology & Imaging Services"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Department</label>
                <input
                  type="text"
                  value={newHospitalDept}
                  onChange={(e) => setNewHospitalDept(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Address</label>
                <input
                  type="text"
                  value={newHospitalAddress}
                  onChange={(e) => setNewHospitalAddress(e.target.value)}
                  placeholder="Jubilee Hills, Road No. 72, Hyderabad"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating in DB...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create Hospital in DB</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
