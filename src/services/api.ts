import { ClinicalDocument, HospitalTenant, Practitioner, Patient, TemplateDefinition, AuditLogEntry } from '../types';

export const API_BASE = '/api/v1';

export interface AuthUser { id: string; name: string; email: string; tenantId: string | null; role: 'system_admin' | 'admin' | 'user' }

async function authRequest<T>(path: string, body?: Record<string, string>): Promise<T> {
  const response = await fetch(`${API_BASE}/auth/${path}`, {
    method: body ? 'POST' : 'GET',
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Authentication request failed.');
  return data;
}

export const getCurrentUser = () => authRequest<{ user: AuthUser }>('me');
export const login = (email: string, password: string) => authRequest<{ user: AuthUser }>('login', { email, password });
export const signup = (name: string, email: string, password: string) => authRequest<{ user: AuthUser }>('signup', { name, email, password });
export const logout = () => authRequest<{ success: boolean }>('logout', {});
export const changePassword = (currentPassword: string, newPassword: string) =>
  authRequest<{ success: boolean }>('change-password', { currentPassword, newPassword });

export interface InvoiceRecord {
  id: string;
  invoice_number: string;
  document_id: string;
  tenant_id: string;
  patient_id: string | null;
  patient_name: string;
  mobile_number: string | null;
  diagnostic_type: string;
  amount: string | number;
  currency: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED';
  created_at: string;
}

export async function searchReports(filters: { name?: string; mobile?: string; diagnosticType?: string }): Promise<ClinicalDocument[]> {
  const params = new URLSearchParams();
  if (filters.name) params.set('name', filters.name);
  if (filters.mobile) params.set('mobile', filters.mobile);
  if (filters.diagnosticType) params.set('diagnosticType', filters.diagnosticType);
  const response = await apiFetch(`${API_BASE}/reports/search?${params.toString()}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not search reports.');
  return data.documents || [];
}

export async function getInvoices(filters: { from?: string; to?: string } = {}): Promise<InvoiceRecord[]> {
  const params = new URLSearchParams();
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  const response = await apiFetch(`${API_BASE}/invoices${params.size ? `?${params.toString()}` : ''}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not load invoices.');
  return data.invoices || [];
}

export async function updateInvoice(id: string, updates: { amount?: number; status?: InvoiceRecord['status'] }): Promise<InvoiceRecord> {
  const response = await apiFetch(`${API_BASE}/invoices/${encodeURIComponent(id)}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not update invoice.');
  return data.invoice;
}

export async function createInvoice(documentId: string, amount: number): Promise<InvoiceRecord> {
  const response = await apiFetch(`${API_BASE}/invoices`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ documentId, amount })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not create invoice.');
  return data.invoice;
}

export interface HospitalMappings {
  users: Array<{ id: string; name: string; email: string; role: string; tenant_id: string | null; tenant_name: string | null }>;
  tenants: HospitalTenant[];
}

export async function getHospitalMappings(): Promise<HospitalMappings> {
  const response = await apiFetch(`${API_BASE}/system-admin/user-hospital-mappings`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not load hospital mappings.');
  return data;
}

export async function mapUserToHospital(userId: string, tenantId: string) {
  const response = await apiFetch(`${API_BASE}/system-admin/users/${userId}/hospital`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenantId }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not map user to hospital.');
  return data.user;
}

// Global API Request Listener State Tracker
type ApiStateListener = (state: { activeRequests: number; isLoading: boolean }) => void;
const listeners: Set<ApiStateListener> = new Set();
let activeRequestsCount = 0;

export function subscribeApiState(listener: ApiStateListener) {
  listeners.add(listener);
  listener({ activeRequests: activeRequestsCount, isLoading: activeRequestsCount > 0 });
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  const state = { activeRequests: activeRequestsCount, isLoading: activeRequestsCount > 0 };
  listeners.forEach(l => l(state));
}

async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  activeRequestsCount++;
  notifyListeners();
  try {
    const response = await fetch(input, init);
    if (response.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('raddoc:session-expired'));
    }
    return response;
  } finally {
    activeRequestsCount = Math.max(0, activeRequestsCount - 1);
    notifyListeners();
  }
}

export async function getTenants(): Promise<HospitalTenant[]> {
  const res = await apiFetch(`${API_BASE}/tenants`);
  const data = await res.json();
  return data.tenants || [];
}

export async function createTenant(payload: Partial<HospitalTenant>): Promise<HospitalTenant> {
  const res = await apiFetch(`${API_BASE}/tenants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data.tenant;
}

export async function updateTenant(id: string, payload: Partial<HospitalTenant>): Promise<HospitalTenant> {
  const res = await apiFetch(`${API_BASE}/tenants/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data.tenant;
}

export async function getPractitioners(): Promise<Practitioner[]> {
  const res = await apiFetch(`${API_BASE}/practitioners`);
  const data = await res.json();
  return data.practitioners || [];
}

export async function createPractitioner(payload: Partial<Practitioner>): Promise<Practitioner> {
  const res = await apiFetch(`${API_BASE}/practitioners`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data.practitioner;
}

export async function updatePractitioner(id: string, payload: Partial<Practitioner>): Promise<Practitioner> {
  const res = await apiFetch(`${API_BASE}/practitioners/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data.practitioner;
}

export async function deletePractitioner(id: string): Promise<boolean> {
  const res = await apiFetch(`${API_BASE}/practitioners/${id}`, {
    method: 'DELETE'
  });
  const data = await res.json();
  return !!data.success;
}

export async function getPatients(): Promise<Patient[]> {
  const res = await apiFetch(`${API_BASE}/patients`);
  const data = await res.json();
  return data.patients || [];
}

export async function createPatient(payload: Partial<Patient>): Promise<Patient> {
  const res = await apiFetch(`${API_BASE}/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data.patient;
}

export async function updatePatient(id: string, payload: Partial<Patient>): Promise<Patient> {
  const res = await apiFetch(`${API_BASE}/patients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data.patient;
}

export async function deletePatient(id: string): Promise<boolean> {
  const res = await apiFetch(`${API_BASE}/patients/${id}`, {
    method: 'DELETE'
  });
  const data = await res.json();
  return !!data.success;
}

export async function getTemplates(modality?: string): Promise<TemplateDefinition[]> {
  const url = modality ? `${API_BASE}/templates?modality=${modality}` : `${API_BASE}/templates`;
  const res = await apiFetch(url);
  const data = await res.json();
  return data.templates || [];
}

export async function getDocuments(tenantId?: string): Promise<ClinicalDocument[]> {
  const url = tenantId ? `${API_BASE}/documents?tenantId=${tenantId}` : `${API_BASE}/documents`;
  const res = await apiFetch(url);
  const data = await res.json();
  return data.documents || [];
}

export async function getDocumentById(id: string): Promise<ClinicalDocument> {
  const res = await apiFetch(`${API_BASE}/documents/${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not open this report.');
  return data.document;
}

export async function createDocument(payload: Partial<ClinicalDocument>): Promise<ClinicalDocument> {
  const res = await apiFetch(`${API_BASE}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data.document;
}

export async function updateDocument(id: string, payload: Partial<ClinicalDocument>): Promise<ClinicalDocument> {
  const res = await apiFetch(`${API_BASE}/documents/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data.document;
}

export async function triggerAIGeneration(id: string): Promise<{ document: ClinicalDocument; aiResults: any }> {
  const res = await apiFetch(`${API_BASE}/documents/${id}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  return data;
}

export async function runComparativeAnalysis(id: string, previousDocumentId: string): Promise<{ document: ClinicalDocument; comparativeAnalysis: any }> {
  const res = await apiFetch(`${API_BASE}/documents/${id}/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ previousDocumentId })
  });
  return await res.json();
}

export async function validateDocument(id: string): Promise<any> {
  const res = await apiFetch(`${API_BASE}/documents/${id}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return await res.json();
}

export async function approveDocument(id: string, practitioner?: Practitioner): Promise<ClinicalDocument> {
  const res = await apiFetch(`${API_BASE}/documents/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ practitioner })
  });
  const data = await res.json();
  return data.document;
}

export async function signDocument(id: string, practitioner?: Practitioner, signatureImage?: string): Promise<ClinicalDocument> {
  const res = await apiFetch(`${API_BASE}/documents/${id}/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ practitioner, signatureImage })
  });
  const data = await res.json();
  return data.document;
}

export async function getFHIRBundle(id: string): Promise<any> {
  const res = await apiFetch(`${API_BASE}/documents/${id}/fhir`);
  return await res.json();
}

export async function parseVoiceDictation(dictationText: string, templateId: string): Promise<Record<string, any>> {
  const res = await apiFetch(`${API_BASE}/voice/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dictationText, templateId })
  });
  const data = await res.json();
  return data.extractedObservations || {};
}

export async function sendCoPilotChat(payload: { message: string; document: ClinicalDocument; templateId: string; ragEnabled?: boolean }): Promise<{
  reply: string;
  extractedObservations?: Record<string, any>;
  suggestedNarrative?: string;
  suggestedImpression?: string[];
}> {
  const res = await apiFetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return await res.json();
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  const res = await apiFetch(`${API_BASE}/audit-logs`);
  const data = await res.json();
  return data.logs || [];
}

export async function getDataSourceConfig(): Promise<{
  useDatabaseData: boolean;
  dataSource: 'DATABASE' | 'SAMPLE';
  dbConnected: boolean;
  config: any;
}> {
  const res = await apiFetch(`${API_BASE}/config/data-source`);
  return await res.json();
}

export async function toggleDataSource(useDatabaseData?: boolean, dataSource?: string): Promise<{
  message: string;
  useDatabaseData: boolean;
  dataSource: 'DATABASE' | 'SAMPLE';
  dbConnected: boolean;
  documentCount: number;
}> {
  const res = await apiFetch(`${API_BASE}/config/data-source`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ useDatabaseData, dataSource })
  });
  return await res.json();
}
