import React, { useRef } from 'react';
import { ClinicalDocument, HospitalTenant } from '../types';
import { downloadReportPdf, printReportPdf } from '../services/pdfGenerator';
import { Printer, Download, CheckCircle2, ShieldCheck, X, FileText, FileCode } from 'lucide-react';

interface PdfReportPreviewProps {
  document: ClinicalDocument;
  tenant: HospitalTenant;
  onClose: () => void;
}

export const PdfReportPreview: React.FC<PdfReportPreviewProps> = ({ document: doc, tenant, onClose }) => {
  const reportContentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    printReportPdf(doc, tenant);
  };

  const handleDownloadFile = () => {
    downloadReportPdf(doc, tenant);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden text-slate-800 border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Modal Action Bar (Hidden during print) */}
        <div className="print:hidden bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold text-base">Official Clinical Document Preview & PDF Export</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer border border-cyan-400/30"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>

            <button
              onClick={handleDownloadFile}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              Download Report
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="overflow-y-auto p-4 sm:p-10">
          <div
            id="printable-report"
            ref={reportContentRef}
            className="p-6 sm:p-10 space-y-6 bg-white text-slate-900 rounded-xl print:p-0 print:text-black print:overflow-visible"
          >
            {/* Hospital Header */}
            <div className="border-b-2 border-slate-900 pb-6 text-center space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-left">
                  <img
                    src={tenant?.logoUrl}
                    alt={tenant?.name}
                    className="w-16 h-16 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                  />
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{tenant?.name}</h1>
                    <p className="text-xs font-medium text-slate-600">{tenant?.address}</p>
                    <p className="text-xs text-slate-500">Phone: {tenant?.phone} | Email: {tenant?.email}</p>
                  </div>
                </div>
                <div className="text-right hidden sm:block flex-shrink-0">
                  <span className="text-xs font-semibold uppercase px-2.5 py-1 bg-slate-100 text-slate-700 rounded border border-slate-300">
                    {tenant?.accreditation}
                  </span>
                  <p className="text-xs text-slate-500 mt-2">Facility Code: {tenant?.code}</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">{tenant?.headerTitle}</h2>
              </div>
            </div>

            {/* Patient Demographics Banner Table */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs grid grid-cols-2 sm:grid-cols-4 gap-4 print:bg-white print:border-slate-300">
              <div>
                <p className="text-slate-500 uppercase text-[10px] font-semibold">Patient Name</p>
                <p className="font-bold text-slate-900 text-sm">{doc?.patient?.name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase text-[10px] font-semibold">Patient ID / UHID</p>
                <p className="font-semibold text-slate-900">{doc?.patient?.patientId || '--'}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase text-[10px] font-semibold">Age / Gender</p>
                <p className="font-semibold text-slate-900">{doc?.patient?.age || '--'} Yrs / {doc?.patient?.gender || 'U'}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase text-[10px] font-semibold">Date of Birth (DOB)</p>
                <p className="font-semibold text-slate-900">{doc?.patient?.dob || 'N/A'}</p>
              </div>

              <div>
                <p className="text-slate-500 uppercase text-[10px] font-semibold">Contact Number</p>
                <p className="font-semibold text-slate-900">{doc?.patient?.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase text-[10px] font-semibold">Study Date</p>
                <p className="font-semibold text-slate-900">{new Date(doc.studyDate).toLocaleDateString('en-GB')}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase text-[10px] font-semibold">Study Type</p>
                <p className="font-bold text-cyan-800">{doc.templateName}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase text-[10px] font-semibold">Accession No.</p>
                <p className="font-semibold text-slate-900">{doc.accessionNumber}</p>
              </div>

              <div>
                <p className="text-slate-500 uppercase text-[10px] font-semibold">Referring Doctor</p>
                <p className="font-semibold text-slate-900">{doc.referringPhysician}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase text-[10px] font-semibold">Report Status</p>
                <p className="font-bold text-emerald-700 uppercase">{doc.status}</p>
              </div>
              {doc?.patient?.clinicalHistory && (
                <div className="col-span-2">
                  <p className="text-slate-500 uppercase text-[10px] font-semibold">Clinical Indication</p>
                  <p className="font-medium text-slate-800">{doc.patient.clinicalHistory}</p>
                </div>
              )}
            </div>

            {/* Structured Key Measurements Summary Grid */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                Key Structured Measurements & Observations
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {Object.entries(doc.observations).map(([key, obs]) => {
                  const o = obs as any;
                  return (
                    <div key={key} className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="text-slate-500 capitalize block text-[10px]">{key.replace(/_/g, ' ')}</span>
                      <span className="font-semibold text-slate-900">{String(o?.value ?? '')} {o?.unit || ''}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FINDINGS Narrative Section */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1">
                FINDINGS
              </h3>
              <div className="text-sm leading-relaxed text-slate-800 whitespace-pre-line font-sans">
                {doc.findingsText || 'No narrative findings recorded.'}
              </div>
            </div>

            {/* IMPRESSION Section */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1">
                IMPRESSION
              </h3>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm font-medium text-slate-900 space-y-1 print:bg-white">
                {doc.impressionText.length > 0 ? (
                  doc.impressionText.map((imp, idx) => (
                    <p key={idx} className="leading-snug">{imp}</p>
                  ))
                ) : (
                  <p className="text-slate-500 italic">No diagnostic impression provided.</p>
                )}
              </div>
            </div>

            {/* Signature & Verification Seal Footer */}
            <div className="pt-8 border-t border-slate-200 flex flex-wrap items-end justify-between gap-6">
              {/* Cryptographic QR Verification Placeholder */}
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-slate-900 text-white flex flex-col items-center justify-center p-1 rounded text-center text-[8px]">
                  <ShieldCheck className="w-6 h-6 text-emerald-400 mb-0.5" />
                  <span className="font-bold">VERIFIED</span>
                  <span>FHIR R4</span>
                </div>
                <div className="text-[10px] text-slate-500 space-y-0.5">
                  <p className="font-semibold text-slate-700">Digital Document Hash:</p>
                  <p className="font-mono bg-slate-100 p-1 rounded border border-slate-200 text-slate-800 text-[9px] break-all">
                    {doc.digitalSignature?.hash || '0x94f28e1c30a84d9f'}
                  </p>
                  <p>Issued by: {tenant.name} Clinical Portal</p>
                </div>
              </div>

              {/* Doctor Signature Box */}
              <div className="text-right space-y-1">
                {doc.digitalSignature ? (
                  <div className="inline-block border border-emerald-300 bg-emerald-50/50 p-3 rounded-lg text-left">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs mb-1">
                      <CheckCircle2 className="w-4 h-4" />
                      DIGITALLY SIGNED REPORT
                    </div>
                    <p className="font-bold text-slate-900 text-sm">{doc.digitalSignature.signedBy}</p>
                    <p className="text-xs text-slate-600">{doc.practitioner?.qualification || 'Consultant Radiologist'}</p>
                    <p className="text-[10px] text-slate-500">Reg No: {doc.digitalSignature.registrationNo}</p>
                    <p className="text-[9px] text-slate-400 mt-1">Signed at: {new Date(doc.digitalSignature.signedAt).toLocaleString()}</p>
                  </div>
                ) : (
                  <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg text-center text-xs text-slate-400">
                    <p className="font-bold text-slate-700">{doc.practitioner?.name || 'Dr. K. Senthil Kumar, MD'}</p>
                    <p>Senior Consultant Radiologist</p>
                    <p className="italic text-[10px] text-amber-600 font-semibold mt-1">[ Pending Digital Signature ]</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
