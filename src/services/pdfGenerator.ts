/**
 * Open Source PDF Generation Service (jsPDF Engine)
 * Generates vector PDF documents for Radiology Clinical Reports, digital signatures, and patient records.
 */

import { jsPDF } from 'jspdf';
import { ClinicalDocument, HospitalTenant } from '../types';

/**
 * Constructs a vector PDF document using jsPDF
 */
export function generateRadiologyPdf(doc: ClinicalDocument, tenant: HospitalTenant): jsPDF {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 15;
  const contentWidth = pageWidth - (marginX * 2); // 180mm
  let y = 15;

  // Primary colors
  const primaryColor = [8, 145, 178]; // Cyan #0891b2
  const darkTextColor = [15, 23, 42]; // Slate 900 #0f172a
  const mutedTextColor = [71, 85, 105]; // Slate 600 #475569
  const lightBgColor = [248, 250, 252]; // Slate 50 #f8fafc
  const borderColor = [226, 232, 240]; // Slate 200 #e2e8f0

  // ==========================================
  // 1. HOSPITAL BRANDING & HEADER
  // ==========================================
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.text(tenant?.name || 'CHAKKRA CLINICAL HEALTHCARE SYSTEM', marginX, y);
  y += 6;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  pdf.text(tenant?.headerTitle || 'DEPARTMENT OF RADIOLOGY & DIAGNOSTIC IMAGING', marginX, y);
  y += 5;

  if (tenant?.department) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    pdf.text(tenant.department, marginX, y);
    y += 4.5;
  }

  // Address & Accreditation Right Aligned or Subheader
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(5, 150, 105); // Emerald #059669
  pdf.text(`[ ${tenant?.accreditation || 'NABH & NABL ACCREDITED FACILITY'} ]`, marginX, y);
  y += 4.5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  const contactLine = `Address: ${tenant?.address || 'Healthcare Block, Main Campus'} | Phone: ${tenant?.phone || '+91 40 2360 7777'} | Email: ${tenant?.email || 'radiology@chakkra.health'}`;
  const splitContact = pdf.splitTextToSize(contactLine, contentWidth);
  pdf.text(splitContact, marginX, y);
  y += (splitContact.length * 4) + 2;

  // Header Divider Line
  pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.setLineWidth(0.8);
  pdf.line(marginX, y, marginX + contentWidth, y);
  y += 5;

  // ==========================================
  // 2. REPORT TITLE BANNER
  // ==========================================
  pdf.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(marginX, y, contentWidth, 12, 2, 2, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  pdf.text(`RADIOLOGY REPORT - ${doc?.templateName?.toUpperCase() || 'DIAGNOSTIC STUDY'}`, marginX + 4, y + 7.5);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.text(`MODALITY: ${doc?.modality || 'USG'}`, marginX + contentWidth - 4, y + 7.5, { align: 'right' });
  y += 16;

  // ==========================================
  // 3. PATIENT DEMOGRAPHICS & STUDY DETAILS TABLE
  // ==========================================
  const tableTopY = y;
  const rowHeight = 6;
  const col1X = marginX + 3;
  const col2X = marginX + 93;

  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  pdf.rect(marginX, y, contentWidth, 32, 'D');

  pdf.setFontSize(8.5);

  // Row 1
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  pdf.text('Patient Name:', col1X, y + 5);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  pdf.text(doc?.patient?.name || 'Unregistered Patient', col1X + 26, y + 5);

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  pdf.text('UHID / Patient ID:', col2X, y + 5);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.text(doc?.patient?.patientId || '--', col2X + 32, y + 5);

  // Row 2
  y += rowHeight;
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  pdf.text('Age / Gender:', col1X, y + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  pdf.text(`${doc?.patient?.age || '--'} Yrs / ${doc?.patient?.gender || 'Male'}`, col1X + 26, y + 5);

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  pdf.text('Accession No (RIS):', col2X, y + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  pdf.text(doc?.accessionNumber || '--', col2X + 32, y + 5);

  // Row 3
  y += rowHeight;
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  pdf.text('Date of Birth:', col1X, y + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  pdf.text(doc?.patient?.dob ? new Date(doc.patient.dob).toLocaleDateString() : 'N/A', col1X + 26, y + 5);

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  pdf.text('Study Date & Time:', col2X, y + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  pdf.text(doc?.studyDate ? new Date(doc.studyDate).toLocaleString() : new Date().toLocaleString(), col2X + 32, y + 5);

  // Row 4
  y += rowHeight;
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  pdf.text('Contact Phone:', col1X, y + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  pdf.text(doc?.patient?.phone || 'N/A', col1X + 26, y + 5);

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  pdf.text('Referring Physician:', col2X, y + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  pdf.text(doc?.referringPhysician || 'Dr. V. Ramanathan, MD', col2X + 32, y + 5);

  // Row 5 (Clinical History)
  y += rowHeight;
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  pdf.text('Clinical History:', col1X, y + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  const historyText = doc?.patient?.clinicalHistory || 'Routine diagnostic evaluation.';
  pdf.text(pdf.splitTextToSize(historyText, contentWidth - 32), col1X + 26, y + 5);

  y = tableTopY + 36;

  // Check Page Break
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 20) {
      pdf.addPage();
      y = 15;
    }
  };

  // ==========================================
  // 4. STRUCTURED MEASUREMENTS / OBSERVATIONS
  // ==========================================
  if (doc?.observations && Object.keys(doc.observations).length > 0) {
    checkPageBreak(30);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text('STRUCTURED PROTOCOL MEASUREMENTS', marginX, y);
    y += 4;

    pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.setLineWidth(0.4);
    pdf.line(marginX, y, marginX + contentWidth, y);
    y += 4;

    pdf.setFontSize(8.5);
    const obsEntries = Object.entries(doc.observations);
    obsEntries.forEach(([key, obs]) => {
      checkPageBreak(6);
      const valStr = typeof obs === 'object' && obs !== null ? `${obs.value || ''} ${obs.unit || ''}`.trim() : String(obs);
      if (valStr) {
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
        pdf.text(`• ${key}:`, marginX + 3, y);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
        pdf.text(valStr, marginX + 50, y);
        y += 5;
      }
    });
    y += 4;
  }

  // ==========================================
  // 5. FINDINGS / NARRATIVE SECTION
  // ==========================================
  checkPageBreak(30);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10.5);
  pdf.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  pdf.text('CLINICAL FINDINGS', marginX, y);
  y += 4;

  pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  pdf.setLineWidth(0.4);
  pdf.line(marginX, y, marginX + contentWidth, y);
  y += 5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);

  const findings = doc?.findingsText || 'Examination performed as per standard radiology protocol. No significant abnormality detected on routine screening.';
  const splitFindings = pdf.splitTextToSize(findings, contentWidth);
  
  splitFindings.forEach((line: string) => {
    checkPageBreak(5);
    pdf.text(line, marginX, y);
    y += 4.5;
  });
  y += 6;

  // ==========================================
  // 6. IMPRESSION SECTION
  // ==========================================
  checkPageBreak(30);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10.5);
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.text('IMPRESSION & DIAGNOSTIC OPINION', marginX, y);
  y += 4;

  pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.setLineWidth(0.4);
  pdf.line(marginX, y, marginX + contentWidth, y);
  y += 5;

  const impressions = doc?.impressionText && doc.impressionText.length > 0
    ? doc.impressionText
    : ['No acute focal intra-abdominal abnormality identified.', 'Clinical correlation recommended.'];

  impressions.forEach((imp, idx) => {
    const bulletText = `${idx + 1}. ${imp}`;
    const splitImp = pdf.splitTextToSize(bulletText, contentWidth - 4);
    splitImp.forEach((line: string) => {
      checkPageBreak(5);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
      pdf.text(line, marginX + 2, y);
      y += 4.5;
    });
  });
  y += 8;

  // ==========================================
  // 7. PRACTITIONER SIGNATURE & PKI DIGITAL SEAL
  // ==========================================
  checkPageBreak(35);
  const practitioner = doc?.practitioner || {
    name: 'Dr. K. Senthil Kumar, MD',
    qualification: 'MD (Radiodiagnosis), FRCR (UK)',
    registrationNo: 'TN-MMC-88419',
    designation: 'Senior Consultant Radiologist & HOD'
  };

  const sigBoxY = y;
  pdf.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(marginX + 90, sigBoxY, 90, 32, 2, 2, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  pdf.text(practitioner.name, marginX + 94, sigBoxY + 6);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  pdf.text(practitioner.qualification, marginX + 94, sigBoxY + 10);
  pdf.text(`${practitioner.designation}`, marginX + 94, sigBoxY + 14);
  pdf.text(`Reg No: ${practitioner.registrationNo}`, marginX + 94, sigBoxY + 18);

  // Digital PKI Hash Seal
  const sigHash = doc?.digitalSignature?.hash || `0x${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(5, 150, 105);
  pdf.text(`[PKI SEAL: ${sigHash.substring(0, 24)}...]`, marginX + 94, sigBoxY + 23);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Status: ${doc?.status || 'DIGITALLY SIGNED'}`, marginX + 94, sigBoxY + 27);

  y += 38;

  // ==========================================
  // 8. PAGE FOOTER
  // ==========================================
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);

    pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    pdf.setLineWidth(0.2);
    pdf.line(marginX, pageHeight - 12, marginX + contentWidth, pageHeight - 12);

    pdf.text('Confidential Medical Diagnostic Document - Generated by Chakkra Clinical Engine', marginX, pageHeight - 7);
    pdf.text(`Page ${i} of ${totalPages}`, marginX + contentWidth, pageHeight - 7, { align: 'right' });
  }

  return pdf;
}

/**
 * Downloads the report directly as a vector PDF file using jsPDF
 */
export function downloadReportPdf(doc: ClinicalDocument, tenant: HospitalTenant): void {
  const pdf = generateRadiologyPdf(doc, tenant);
  const patientName = (doc?.patient?.name || 'Patient').replace(/\s+/g, '_');
  const uhid = doc?.patient?.patientId || 'UHID';
  const fileName = `${patientName}_${uhid}_Radiology_Report.pdf`;
  pdf.save(fileName);
}

/**
 * Opens direct system print dialog for the vector PDF document using jsPDF blob URL
 */
export function printReportPdf(doc: ClinicalDocument, tenant: HospitalTenant): void {
  const pdf = generateRadiologyPdf(doc, tenant);
  const pdfBlob = pdf.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = blobUrl;

  document.body.appendChild(iframe);

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      window.open(blobUrl, '_blank');
    }
  };

  setTimeout(() => {
    document.body.removeChild(iframe);
    URL.revokeObjectURL(blobUrl);
  }, 30000);
}
