import { ClinicalDocument, HospitalTenant, Practitioner, Patient, TemplateDefinition, AuditLogEntry } from '../types';

export const API_BASE = '/api/v1';

export async function getTenants(): Promise<HospitalTenant[]> {
  const res = await fetch(`${API_BASE}/tenants`);
  const data = await res.json();
  return data.tenants || [];
}

export async function getPractitioners(): Promise<Practitioner[]> {
  const res = await fetch(`${API_BASE}/practitioners`);
  const data = await res.json();
  return data.practitioners || [];
}

export async function createPractitioner(payload: Partial<Practitioner>): Promise<Practitioner> {
  const res = await fetch(`${API_BASE}/practitioners`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data.practitioner;
}

export async function updatePractitioner(id: string, payload: Partial<Practitioner>): Promise<Practitioner> {
  const res = await fetch(`${API_BASE}/practitioners/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data.practitioner;
}

export async function deletePractitioner(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/practitioners/${id}`, {
    method: 'DELETE'
  });
  const data = await res.json();
  return !!data.success;
}

export async function getPatients(): Promise<Patient[]> {
  const res = await fetch(`${API_BASE}/patients`);
  const data = await res.json();
  return data.patients || [];
}

export async function getTemplates(modality?: string): Promise<TemplateDefinition[]> {
  const url = modality ? `${API_BASE}/templates?modality=${modality}` : `${API_BASE}/templates`;
  const res = await fetch(url);
  const data = await res.json();
  return data.templates || [];
}

export async function getDocuments(tenantId?: string): Promise<ClinicalDocument[]> {
  const url = tenantId ? `${API_BASE}/documents?tenantId=${tenantId}` : `${API_BASE}/documents`;
  const res = await fetch(url);
  const data = await res.json();
  return data.documents || [];
}

export async function getDocumentById(id: string): Promise<ClinicalDocument> {
  const res = await fetch(`${API_BASE}/documents/${id}`);
  const data = await res.json();
  return data.document;
}

export async function createDocument(payload: Partial<ClinicalDocument>): Promise<ClinicalDocument> {
  const res = await fetch(`${API_BASE}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data.document;
}

export async function updateDocument(id: string, payload: Partial<ClinicalDocument>): Promise<ClinicalDocument> {
  const res = await fetch(`${API_BASE}/documents/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data.document;
}

export async function triggerAIGeneration(id: string): Promise<{ document: ClinicalDocument; aiResults: any }> {
  const res = await fetch(`${API_BASE}/documents/${id}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  return data;
}

export async function validateDocument(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/documents/${id}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return await res.json();
}

export async function approveDocument(id: string, practitioner?: Practitioner): Promise<ClinicalDocument> {
  const res = await fetch(`${API_BASE}/documents/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ practitioner })
  });
  const data = await res.json();
  return data.document;
}

export async function signDocument(id: string, practitioner?: Practitioner, signatureImage?: string): Promise<ClinicalDocument> {
  const res = await fetch(`${API_BASE}/documents/${id}/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ practitioner, signatureImage })
  });
  const data = await res.json();
  return data.document;
}

export async function getFHIRBundle(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/documents/${id}/fhir`);
  return await res.json();
}

export async function parseVoiceDictation(dictationText: string, templateId: string): Promise<Record<string, any>> {
  const res = await fetch(`${API_BASE}/voice/parse`, {
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
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return await res.json();
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  const res = await fetch(`${API_BASE}/audit-logs`);
  const data = await res.json();
  return data.logs || [];
}

export async function getDataSourceConfig(): Promise<{
  useDatabaseData: boolean;
  dataSource: 'DATABASE' | 'SAMPLE';
  dbConnected: boolean;
  config: any;
}> {
  const res = await fetch(`${API_BASE}/config/data-source`);
  return await res.json();
}

export async function toggleDataSource(useDatabaseData?: boolean, dataSource?: string): Promise<{
  message: string;
  useDatabaseData: boolean;
  dataSource: 'DATABASE' | 'SAMPLE';
  dbConnected: boolean;
  documentCount: number;
}> {
  const res = await fetch(`${API_BASE}/config/data-source`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ useDatabaseData, dataSource })
  });
  return await res.json();
}
