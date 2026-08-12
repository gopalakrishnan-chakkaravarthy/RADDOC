import React, { useState } from 'react';
import { HospitalTenant } from '../types';
import {
  FileText,
  Activity,
  GitCompare,
  Code2,
  Building2,
  History,
  ShieldCheck,
  Stethoscope,
  Sparkles,
  Layers,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  tenants: HospitalTenant[];
  selectedTenant: HospitalTenant;
  onSelectTenant: (tenant: HospitalTenant) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  reportStatus?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  tenants,
  selectedTenant,
  onSelectTenant,
  activeTab,
  setActiveTab,
  reportStatus
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'studio', label: 'Report Studio', icon: Stethoscope },
    { id: 'queue', label: 'Clinical Queue', icon: Layers },
    { id: 'comparison', label: 'Previous Study Compare', icon: GitCompare },
    { id: 'fhir', label: 'FHIR & DICOM SR', icon: FileText },
    { id: 'api', label: 'Developer API Explorer', icon: Code2 },
    { id: 'settings', label: 'Hospital & Doctors', icon: Building2 },
    { id: 'audit', label: 'Audit Trail', icon: History },
  ];

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-xl">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-2 min-w-0">
        {/* Logo & Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/20 flex-shrink-0">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-white truncate">Chakkra</span>
              <span className="hidden xs:inline-flex text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-medium border border-cyan-500/30 whitespace-nowrap">
                Clinical Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden lg:block truncate max-w-xs">Structured Clinical Intelligence API & Automation</p>
          </div>
        </div>

        {/* Right Section: Tenant Switcher, Badges & Mobile Menu Button */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* Tenant Dropdown */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-800/80 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-slate-200 shadow-inner max-w-[130px] sm:max-w-xs">
            <Building2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <select
              value={selectedTenant?.id || ''}
              onChange={(e) => {
                const found = (tenants || []).find(t => t.id === e.target.value);
                if (found) onSelectTenant(found);
              }}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer w-full truncate text-[11px] sm:text-xs"
            >
              {(tenants || []).map(t => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* FHIR Status Badge */}
          <div className="hidden md:flex items-center gap-1.5 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-md font-medium whitespace-nowrap">
            <ShieldCheck className="w-3.5 h-3.5" />
            FHIR R4
          </div>

          {/* AI Badge */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2.5 py-1 rounded-md font-medium whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5" />
            Gemini 3.6
          </div>

          {/* Mobile Menu Hamburger Trigger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all border border-slate-700 flex items-center justify-center min-w-[38px] min-h-[38px] cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-cyan-400" /> : <Menu className="w-5 h-5 text-slate-200" />}
          </button>
        </div>
      </div>

      {/* Desktop Navigation Tabs Bar (Horizontal Scroll Protected) */}
      <div className="hidden md:block bg-slate-950/60 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1.5 overflow-x-auto py-1.5 text-sm no-scrollbar scroll-smooth">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-xs transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
                  isActive
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Navigation Menu Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-t border-b border-slate-800 px-4 py-3 space-y-1.5 shadow-2xl animate-in slide-in-from-top duration-200 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Navigation Menu</span>
            <span className="text-cyan-400">7 Active Modules</span>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-xs transition-all cursor-pointer min-h-[44px] ${
                  isActive
                    ? 'bg-cyan-600 text-white font-semibold shadow-md shadow-cyan-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900 active:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-cyan-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
