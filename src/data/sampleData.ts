import { HospitalTenant, Practitioner, Patient, ClinicalDocument } from '../types';

export const SAMPLE_TENANTS: HospitalTenant[] = [
  {
    id: 'tenant-xyz-hospital',
    name: 'XYZ Multispecialty Hospital',
    code: 'XYZ-CHN-01',
    address: '100 Mount Road, Guindy, Chennai, Tamil Nadu 600032',
    logoUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=150&q=80',
    headerTitle: 'DEPARTMENT OF RADIOLOGY & IMAGING SCIENCES',
    department: 'Radiology & Molecular Imaging',
    phone: '+91 44 2230 9000',
    email: 'radiology@xyzmultispecialty.org',
    accreditation: 'NABH & NABL Accredited Diagnostic Center'
  },
  {
    id: 'tenant-apollo-scan',
    name: 'Apollo Scan & Diagnostic Center',
    code: 'APOLLO-SCAN-02',
    address: '21 Greams Lane, Thousand Lights, Chennai 600006',
    logoUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=150&q=80',
    headerTitle: 'ADVANCED DIAGNOSTICS & PACS IMAGING HUB',
    department: 'Cross-Sectional Imaging',
    phone: '+91 44 2829 0200',
    email: 'reports@apollodiagnostics.com',
    accreditation: 'ISO 15189 Certified'
  },
  {
    id: 'tenant-global-care',
    name: 'Global Care Hospital',
    code: 'GLOBAL-CARE-03',
    address: '43 Perumbakkam Main Rd, Medavakkam, Chennai 600100',
    logoUrl: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=150&q=80',
    headerTitle: 'INSTITUTE OF RADIOLOGY & NUCLEAR MEDICINE',
    department: 'Radiology',
    phone: '+91 44 4477 7777',
    email: 'radiology@globalcare.org',
    accreditation: 'JCI & NABH Accredited'
  }
];

export const SAMPLE_PRACTITIONERS: Practitioner[] = [
  {
    id: 'doc-rad-01',
    name: 'Dr. K. Senthil Kumar, MD, DNB',
    qualification: 'MD (Radiodiagnosis), FRCR (UK)',
    registrationNo: 'TN-MMC-78412',
    designation: 'Senior Consultant Radiologist & HOD',
    signatureImage: 'Dr. K. Senthil Kumar, MD'
  },
  {
    id: 'doc-rad-02',
    name: 'Dr. Ananya R. Sharma, DMRD',
    qualification: 'DMRD, Fellowship in Fetal Imaging',
    registrationNo: 'TN-MMC-92104',
    designation: 'Consultant Radiologist',
    signatureImage: 'Dr. Ananya Sharma'
  }
];

export const SAMPLE_PATIENTS: Patient[] = [
  {
    id: 'pat-01',
    patientId: 'PAT-2026-8841',
    name: 'Ramesh Sundaram',
    age: 48,
    gender: 'Male',
    dob: '1978-04-12',
    phone: '+91 98401 23456'
  },
  {
    id: 'pat-02',
    patientId: 'PAT-2026-9022',
    name: 'Priya Venkatesh',
    age: 34,
    gender: 'Female',
    dob: '1992-09-25',
    phone: '+91 98840 98765'
  },
  {
    id: 'pat-03',
    patientId: 'PAT-2026-7410',
    name: 'Murugan Thangaraj',
    age: 62,
    gender: 'Male',
    dob: '1964-11-03',
    phone: '+91 97100 54321'
  }
];

// Initial pre-loaded historical document for patient Ramesh Sundaram (for Comparison Engine)
export const HISTORICAL_DOCUMENTS: ClinicalDocument[] = [
  {
    id: 'doc-hist-2025-001',
    tenantId: 'tenant-xyz-hospital',
    patient: SAMPLE_PATIENTS[0],
    practitioner: SAMPLE_PRACTITIONERS[0],
    templateId: 'usg-abdomen',
    templateName: 'Ultrasound Whole Abdomen',
    modality: 'USG',
    studyDate: '2025-08-10T10:30:00.000Z',
    accessionNumber: 'ACC-2025-09812',
    referringPhysician: 'Dr. V. Ramanathan, MD (Gen Med)',
    status: 'DIGITALLY_SIGNED',
    observations: {
      liver_size: { value: 15.0, unit: 'cm' },
      liver_echotexture: { value: 'Increased (Fatty Infiltration)' },
      liver_focal_lesion: { value: 'No' },
      portal_vein_diameter: { value: 10.5, unit: 'mm' },
      gb_distension: { value: 'Normal' },
      gb_wall_thickness: { value: 2.2, unit: 'mm' },
      gb_calculus: { value: true },
      gb_calculus_size: { value: 4.2, unit: 'mm' }, // Note 4.2mm in 2025 vs 6.0mm in 2026
      cbd_diameter: { value: 4.8, unit: 'mm' },
      spleen_size: { value: 10.1, unit: 'cm' },
      rk_length: { value: 10.2, unit: 'cm' },
      lk_length: { value: 10.5, unit: 'cm' }
    },
    findingsText: 'Liver is mildly enlarged measuring 15.0 cm with increased echotexture suggestive of mild fatty liver. Gallbladder demonstrates a 4.2 mm calculus with normal wall thickness. CBD measures 4.8 mm. Kidneys and spleen are unremarkable.',
    impressionText: ['1. Grade I fatty liver.', '2. Small 4.2 mm cholelithiasis.'],
    digitalSignature: {
      signedBy: 'Dr. K. Senthil Kumar, MD, DNB',
      practitionerName: 'Dr. K. Senthil Kumar',
      registrationNo: 'TN-MMC-78412',
      signedAt: '2025-08-10T11:45:00.000Z',
      hash: '0x8f2d91a243e8b01c12e5',
      certificateAuthority: 'National Health Cryptographic PKI Authority'
    },
    createdAt: '2025-08-10T10:30:00.000Z',
    updatedAt: '2025-08-10T11:45:00.000Z',
    version: 1
  },

  // Historical CT Chest document for CT comparison testing
  {
    id: 'doc-hist-2025-002',
    tenantId: 'tenant-xyz-hospital',
    patient: SAMPLE_PATIENTS[2],
    practitioner: SAMPLE_PRACTITIONERS[0],
    templateId: 'ct-chest',
    templateName: 'CT Chest (HRCT)',
    modality: 'CT',
    studyDate: '2025-02-14T09:00:00.000Z',
    accessionNumber: 'ACC-2025-03211',
    referringPhysician: 'Dr. S. Meenakshi, DTCD',
    status: 'DIGITALLY_SIGNED',
    observations: {
      lung_nodule: { value: true },
      nodule_location: { value: 'Right Upper Lobe' },
      nodule_size: { value: 5.0, unit: 'mm' } // Was 5.0mm in 2025 vs 8.0mm in current 2026
    },
    findingsText: 'Single 5.0 mm non-calcified solid pulmonary nodule identified in the right upper lobe subpleural parenchyma.',
    impressionText: ['1. Solitary 5.0 mm right upper lobe pulmonary nodule. Follow up recommended in 12 months.'],
    createdAt: '2025-02-14T09:00:00.000Z',
    updatedAt: '2025-02-14T09:30:00.000Z',
    version: 1
  }
];
