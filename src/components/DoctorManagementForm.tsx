import React, { useState } from 'react';
import { Practitioner } from '../types';
import {
  UserPlus,
  UserCheck,
  Edit3,
  Trash2,
  Stethoscope,
  Award,
  FileCheck2,
  Building,
  CheckCircle2,
  Search,
  Plus,
  X,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface DoctorManagementFormProps {
  practitioners: Practitioner[];
  onAddPractitioner: (doctor: Partial<Practitioner>) => Promise<void>;
  onUpdatePractitioner: (id: string, updated: Partial<Practitioner>) => Promise<void>;
  onDeletePractitioner: (id: string) => Promise<void>;
}

export const DoctorManagementForm: React.FC<DoctorManagementFormProps> = ({
  practitioners = [],
  onAddPractitioner,
  onUpdatePractitioner,
  onDeletePractitioner
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Practitioner | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add form state
  const [formData, setFormData] = useState({
    name: '',
    qualification: '',
    registrationNo: '',
    designation: '',
    signatureImage: ''
  });

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleResetForm = () => {
    setFormData({
      name: '',
      qualification: '',
      registrationNo: '',
      designation: '',
      signatureImage: ''
    });
  };

  const applyPresetDesignation = (qualification: string, designation: string) => {
    setFormData(prev => ({
      ...prev,
      qualification: prev.qualification || qualification,
      designation
    }));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.registrationNo.trim()) {
      showNotification('Doctor Name and Registration Number are required', 'error');
      return;
    }

    try {
      await onAddPractitioner({
        name: formData.name.trim(),
        qualification: formData.qualification.trim() || 'MD (Radiodiagnosis)',
        registrationNo: formData.registrationNo.trim(),
        designation: formData.designation.trim() || 'Consultant Radiologist',
        signatureImage: formData.signatureImage.trim() || formData.name.trim()
      });
      setIsAddModalOpen(false);
      handleResetForm();
      showNotification(`Successfully added ${formData.name}`);
    } catch (err) {
      showNotification('Failed to add doctor record', 'error');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;
    if (!editingDoctor.name.trim() || !editingDoctor.registrationNo.trim()) {
      showNotification('Doctor Name and Registration Number are required', 'error');
      return;
    }

    try {
      await onUpdatePractitioner(editingDoctor.id, {
        name: editingDoctor.name.trim(),
        qualification: editingDoctor.qualification.trim(),
        registrationNo: editingDoctor.registrationNo.trim(),
        designation: editingDoctor.designation.trim(),
        signatureImage: editingDoctor.signatureImage?.trim() || editingDoctor.name.trim()
      });
      setEditingDoctor(null);
      showNotification(`Updated details for ${editingDoctor.name}`);
    } catch (err) {
      showNotification('Failed to update doctor record', 'error');
    }
  };

  const handleDelete = async (doctor: Practitioner) => {
    if (confirm(`Are you sure you want to remove ${doctor.name} from the active radiologist directory?`)) {
      try {
        await onDeletePractitioner(doctor.id);
        showNotification(`Removed ${doctor.name} from directory`);
      } catch (err) {
        showNotification('Failed to delete doctor record', 'error');
      }
    }
  };

  const filteredPractitioners = practitioners.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.registrationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-xs">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Stethoscope className="w-4 h-4" />
            Radiologist & Consultant Directory
          </div>
          <h2 className="text-xl font-bold text-white">Doctors & Signing Practitioners Registry</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Manage radiologist accounts, medical council registration credentials, qualifications, and digital signature credentials used for approving and signing clinical diagnostic reports.
          </p>
        </div>

        <button
          onClick={() => {
            handleResetForm();
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-600/30 cursor-pointer transition-all border border-cyan-400/30"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Doctor</span>
        </button>
      </div>

      {/* Notification Toast */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-md animate-fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-red-500/20 text-red-300 border border-red-500/40'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{feedbackMsg.text}</span>
          </div>
        </div>
      )}

      {/* Search & Statistics Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search doctor by name, registration no, designation..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 bg-cyan-50 text-cyan-800 px-3 py-1.5 rounded-xl border border-cyan-200 font-semibold text-xs">
          <UserCheck className="w-4 h-4 text-cyan-600" />
          <span>Total Doctors Registered: {practitioners.length}</span>
        </div>
      </div>

      {/* Doctors Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPractitioners.map((doc) => (
          <div
            key={doc.id}
            className="bg-white border border-slate-200 hover:border-cyan-400 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-slate-900 text-cyan-400 flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-slate-800">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{doc.name}</h3>
                    <div className="text-cyan-700 font-medium text-xs flex items-center gap-1">
                      <Building className="w-3.5 h-3.5" />
                      <span>{doc.designation}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingDoctor({ ...doc })}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-cyan-600 hover:bg-slate-100 transition-all cursor-pointer"
                    title="Edit Doctor Details"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                    title="Delete Doctor Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Doctor Metadata Grid */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-[11px]">
                <div>
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <Award className="w-3 h-3 text-cyan-600" /> Qualifications:
                  </span>
                  <p className="font-semibold text-slate-800 truncate mt-0.5">{doc.qualification}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <FileCheck2 className="w-3 h-3 text-cyan-600" /> Reg Number:
                  </span>
                  <p className="font-mono font-bold text-cyan-700 truncate mt-0.5">{doc.registrationNo}</p>
                </div>
              </div>

              {/* Digital Signature Badge */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" /> PKI Signature Seal:
                </span>
                <span className="font-serif italic text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 max-w-[180px] truncate">
                  {doc.signatureImage || doc.name}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredPractitioners.length === 0 && (
          <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
            <Stethoscope className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700 text-sm">No doctors found matching your search</p>
            <p className="text-slate-400 text-xs">Try clearing your search query or add a new doctor record.</p>
          </div>
        )}
      </div>

      {/* Add Doctor Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2 font-bold text-sm">
                <UserPlus className="w-4 h-4 text-cyan-400" />
                <span>Register New Doctor / Radiologist</span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddSubmit} className="p-5 space-y-4 text-xs">
              {/* Presets */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-600 text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-600" />
                  Quick Presets
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPresetDesignation('MD (Radiodiagnosis), FRCR (UK)', 'Senior Consultant Radiologist & HOD')}
                    className="bg-cyan-50 hover:bg-cyan-100 text-cyan-800 px-2.5 py-1 rounded-lg border border-cyan-200 font-medium text-[11px] cursor-pointer"
                  >
                    + HOD Radiologist
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetDesignation('MD (Radiodiagnosis), DNB', 'Consultant Radiologist - Cross-Sectional Imaging')}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 font-medium text-[11px] cursor-pointer"
                  >
                    + Consultant Radiologist
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetDesignation('DMRD, Fellowship in Fetal Medicine', 'Fellowship Consultant - Ultrasonography')}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 font-medium text-[11px] cursor-pointer"
                  >
                    + Fetal Ultrasonography
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">
                  Doctor Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. Rajesh K. Varma, MD"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800">
                    Medical Reg. Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.registrationNo}
                    onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })}
                    placeholder="e.g. TN-MMC-88419"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800">Qualification</label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    placeholder="e.g. MD, DNB (Radiology)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">Designation / Role</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="e.g. Senior Consultant Radiologist"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">Digital Signature Text / Seal</label>
                <input
                  type="text"
                  value={formData.signatureImage}
                  onChange={(e) => setFormData({ ...formData, signatureImage: e.target.value })}
                  placeholder="e.g. Dr. Rajesh K. Varma, MD"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-serif italic text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md shadow-cyan-600/20 cursor-pointer"
                >
                  Save Doctor Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Doctor Modal */}
      {editingDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <span>Edit Doctor Details</span>
              </div>
              <button
                onClick={() => setEditingDoctor(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">
                  Doctor Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingDoctor.name}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800">
                    Medical Reg. Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingDoctor.registrationNo}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, registrationNo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800">Qualification</label>
                  <input
                    type="text"
                    value={editingDoctor.qualification}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, qualification: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">Designation / Role</label>
                <input
                  type="text"
                  value={editingDoctor.designation}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, designation: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">Digital Signature Text / Seal</label>
                <input
                  type="text"
                  value={editingDoctor.signatureImage || ''}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, signatureImage: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-serif italic text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md shadow-cyan-600/20 cursor-pointer"
                >
                  Update Doctor Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
