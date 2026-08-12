import React, { useState, useEffect } from 'react';
import { HospitalTenant, Practitioner } from '../types';
import { Building2, Save, Check, Shield, Image, Mail, Phone, MapPin, BadgeCheck, Stethoscope } from 'lucide-react';
import { DoctorManagementForm } from './DoctorManagementForm';

interface HospitalSettingsProps {
  tenant: HospitalTenant;
  practitioners: Practitioner[];
  onUpdateTenant: (updated: HospitalTenant) => void;
  onAddPractitioner: (doctor: Partial<Practitioner>) => Promise<void>;
  onUpdatePractitioner: (id: string, updated: Partial<Practitioner>) => Promise<void>;
  onDeletePractitioner: (id: string) => Promise<void>;
}

export const HospitalSettings: React.FC<HospitalSettingsProps> = ({
  tenant,
  practitioners = [],
  onUpdateTenant,
  onAddPractitioner,
  onUpdatePractitioner,
  onDeletePractitioner
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'branding' | 'doctors'>('branding');
  const [form, setForm] = useState<HospitalTenant>({ ...tenant });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (tenant) setForm({ ...tenant });
  }, [tenant]);

  const handleChange = (field: keyof HospitalTenant, val: string) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTenant(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Sub Tab Navigation Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex items-center gap-2 shadow-lg">
        <button
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

      {/* Sub Tab Content */}
      {activeSubTab === 'branding' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider mb-1">
                <Building2 className="w-4 h-4" />
                Multi-Tenant Hospital Configuration
              </div>
              <h2 className="text-xl font-bold text-white">Hospital Branding & Header Template Settings</h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure official hospital header logos, department name, contact details, and NABH/NABL accreditation metadata.
              </p>
            </div>

            {saved && (
              <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-semibold animate-fade-in">
                <Check className="w-4 h-4" />
                Settings Saved
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
                  value={form.name}
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
                  value={form.code}
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
                  value={form.headerTitle}
                  onChange={(e) => handleChange('headerTitle', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-semibold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Image className="w-4 h-4 text-cyan-600" />
                  Hospital Logo URL
                </label>
                <input
                  type="text"
                  value={form.logoUrl}
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
                  value={form.accreditation}
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
                  value={form.address}
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
                  value={form.phone}
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
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-cyan-600/20 cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" />
                Save Hospital Branding Settings
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
    </div>
  );
};
