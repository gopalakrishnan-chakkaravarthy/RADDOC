export type Modality = 
  | 'USG' // Ultrasound
  | 'X-RAY'
  | 'CT'
  | 'MRI'
  | 'MAMMOGRAPHY'
  | 'ECHO';

export type ReportStatus = 
  | 'DRAFT'
  | 'PRELIMINARY'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'DIGITALLY_SIGNED'
  | 'AMENDED'
  | 'CANCELLED';

export interface FieldDefinition {
  id: string;
  label: string;
  type: 'number' | 'select' | 'text' | 'boolean';
  unit?: string;
  defaultValue?: any;
  options?: string[];
  normalMin?: number;
  normalMax?: number;
  category: string; // e.g. "Liver", "Gallbladder", "Brain", "Chest"
  description?: string;
  required?: boolean;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  modality: Modality;
  category: string;
  description: string;
  fields: FieldDefinition[];
  sampleFindingsPattern?: string;
}

export interface ObservationData {
  [fieldId: string]: {
    value: any;
    unit?: string;
    isAbnormal?: boolean;
    notes?: string;
  };
}

export interface Patient {
  id: string;
  patientId: string; // e.g. PAT-2026-8841
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  dob?: string;
  phone?: string;
  clinicalHistory?: string;
}

export interface Practitioner {
  id: string;
  name: string;
  qualification: string;
  registrationNo: string;
  designation: string;
  signatureImage?: string;
}

export interface HospitalTenant {
  id: string;
  name: string;
  code: string;
  address: string;
  logoUrl: string;
  headerTitle: string;
  department: string;
  phone: string;
  email: string;
  accreditation: string; // e.g. NABH / NABL Accredited
}

export interface ComparisonResult {
  fieldId: string;
  fieldName: string;
  previousValue: any;
  currentValue: any;
  unit?: string;
  changeAmount?: number;
  percentageChange?: number;
  trend: 'increased' | 'decreased' | 'unchanged' | 'new_finding' | 'resolved';
}

export interface AIServiceResults {
  generatedNarrative?: string;
  suggestedImpression?: string[];
  consistencyCheck?: {
    isConsistent: boolean;
    conflicts: Array<{
      field: string;
      expected: string;
      narrativeText: string;
      severity: 'high' | 'medium' | 'low';
    }>;
    explanation: string;
  };
  missingInformation?: {
    hasMissingInfo: boolean;
    items: string[];
    recommendations: string[];
  };
  comparativeAnalysis?: {
    summary: string;
    keyChanges: string[];
  };
}

export interface DocumentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DigitalSignature {
  signedBy: string; // Practitioner ID or Name
  practitionerName: string;
  registrationNo: string;
  signedAt: string;
  hash: string;
  signatureImage?: string;
  certificateAuthority: string;
}

export interface ClinicalDocument {
  id: string;
  tenantId: string;
  patient: Patient;
  practitioner?: Practitioner;
  templateId: string;
  templateName: string;
  modality: Modality;
  studyDate: string;
  accessionNumber: string; // RIS accession no.
  referringPhysician: string;
  status: ReportStatus;
  
  // Core Structured Observations (SOURCE OF TRUTH)
  observations: ObservationData;
  
  // AI Generated / Refined text
  findingsText: string;
  impressionText: string[];
  
  // AI Services output logs
  aiResults?: AIServiceResults;
  
  // Validation status
  validation?: DocumentValidation;
  
  // Signatures
  digitalSignature?: DigitalSignature;
  
  // Compare against previous report ID if any
  previousDocumentId?: string;
  previousDocumentDate?: string;
  comparisonResults?: ComparisonResult[];
  
  // Audit log
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface AuditLogEntry {
  id: string;
  documentId: string;
  timestamp: string;
  actor: string;
  action: string; // 'CREATED' | 'AI_DRAFT_GENERATED' | 'CONSISTENCY_CHECKED' | 'EDITED' | 'APPROVED' | 'SIGNED'
  details: string;
  tenantId: string;
}
