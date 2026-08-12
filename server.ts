import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { RADIOLOGY_TEMPLATES } from './src/data/templates';
import { SAMPLE_TENANTS, SAMPLE_PRACTITIONERS, SAMPLE_PATIENTS, HISTORICAL_DOCUMENTS } from './src/data/sampleData';
import { ClinicalDocument, AuditLogEntry } from './src/types';
import {
  generateNarrative,
  generateImpression,
  checkConsistency,
  detectMissingInfo,
  compareWithPreviousReport,
  parseVoiceDictationToObservations,
  processChatCoPilot
} from './server/geminiService';
import { convertToFHIRDiagnosticReport } from './server/fhirEngine';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// In-Memory Database for active workspace state
let documentsStore: ClinicalDocument[] = [...HISTORICAL_DOCUMENTS];
let practitionersStore = [...SAMPLE_PRACTITIONERS];
let auditLogsStore: AuditLogEntry[] = [
  {
    id: 'log-001',
    documentId: 'doc-hist-2025-001',
    timestamp: '2025-08-10T10:30:00.000Z',
    actor: 'Dr. K. Senthil Kumar, MD',
    action: 'CREATED',
    details: 'Ultrasound Whole Abdomen study created from HMS RIS queue.',
    tenantId: 'tenant-xyz-hospital'
  },
  {
    id: 'log-002',
    documentId: 'doc-hist-2025-001',
    timestamp: '2025-08-10T11:45:00.000Z',
    actor: 'Dr. K. Senthil Kumar, MD',
    action: 'SIGNED',
    details: 'Digitally signed report with PKI certificate hash 0x8f2d91a243e8b01c12e5.',
    tenantId: 'tenant-xyz-hospital'
  }
];

function logAudit(documentId: string, actor: string, action: string, details: string, tenantId: string = 'tenant-xyz-hospital') {
  auditLogsStore.unshift({
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    documentId,
    timestamp: new Date().toISOString(),
    actor,
    action,
    details,
    tenantId
  });
}

// ==========================================
// REST API ROUTES
// ==========================================

// Health Endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Chakkra Clinical Document Intelligence API',
    version: '1.0.0',
    fhirVersion: 'R4',
    timestamp: new Date().toISOString()
  });
});

// Tenants
app.get('/api/v1/tenants', (req, res) => {
  res.json({ tenants: SAMPLE_TENANTS });
});

// Practitioners API
app.get('/api/v1/practitioners', (req, res) => {
  res.json({ count: practitionersStore.length, practitioners: practitionersStore });
});

app.post('/api/v1/practitioners', (req, res) => {
  const { name, qualification, registrationNo, designation, signatureImage } = req.body;
  if (!name || !registrationNo) {
    return res.status(400).json({ error: 'Name and Registration Number are required' });
  }

  const newPractitioner = {
    id: `doc-rad-${Date.now()}`,
    name,
    qualification: qualification || 'MD (Radiodiagnosis)',
    registrationNo,
    designation: designation || 'Consultant Radiologist',
    signatureImage: signatureImage || name
  };

  practitionersStore.push(newPractitioner);
  res.status(201).json({ practitioner: newPractitioner });
});

app.put('/api/v1/practitioners/:id', (req, res) => {
  const index = practitionersStore.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Practitioner not found' });
  }

  const existing = practitionersStore[index];
  const updated = {
    ...existing,
    ...req.body
  };

  practitionersStore[index] = updated;

  // Also update practitioner object in existing clinical documents if matched
  documentsStore = documentsStore.map(doc => {
    if (doc.practitioner && doc.practitioner.id === updated.id) {
      return { ...doc, practitioner: updated };
    }
    return doc;
  });

  res.json({ practitioner: updated });
});

app.delete('/api/v1/practitioners/:id', (req, res) => {
  const index = practitionersStore.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Practitioner not found' });
  }

  const removed = practitionersStore.splice(index, 1)[0];
  res.json({ success: true, removed });
});

// Patients
app.get('/api/v1/patients', (req, res) => {
  res.json({ patients: SAMPLE_PATIENTS });
});

// Templates API
app.get('/api/v1/templates', (req, res) => {
  const { modality } = req.query;
  let templates = RADIOLOGY_TEMPLATES;
  if (modality) {
    templates = templates.filter(t => t.modality === String(modality).toUpperCase());
  }
  res.json({ count: templates.length, templates });
});

app.get('/api/v1/templates/:id', (req, res) => {
  const template = RADIOLOGY_TEMPLATES.find(t => t.id === req.params.id);
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }
  res.json({ template });
});

// Document Management CRUD
app.get('/api/v1/documents', (req, res) => {
  const { tenantId, patientId, status } = req.query;
  let docs = [...documentsStore];
  if (tenantId) docs = docs.filter(d => d.tenantId === String(tenantId));
  if (patientId) docs = docs.filter(d => d.patient.patientId === String(patientId));
  if (status) docs = docs.filter(d => d.status === String(status));
  
  res.json({ count: docs.length, documents: docs });
});

app.get('/api/v1/documents/:id', (req, res) => {
  const doc = documentsStore.find(d => d.id === req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.json({ document: doc });
});

app.post('/api/v1/documents', (req, res) => {
  const { tenantId, patient, templateId, modality, accessionNumber, referringPhysician, observations, previousDocumentId } = req.body;
  
  const template = RADIOLOGY_TEMPLATES.find(t => t.id === templateId);
  const templateName = template ? template.name : 'Radiology Study';

  const newDoc: ClinicalDocument = {
    id: `doc-${Date.now()}`,
    tenantId: tenantId || 'tenant-xyz-hospital',
    patient: patient || SAMPLE_PATIENTS[0],
    templateId,
    templateName,
    modality: modality || 'USG',
    studyDate: new Date().toISOString(),
    accessionNumber: accessionNumber || `ACC-${Math.floor(100000 + Math.random() * 900000)}`,
    referringPhysician: referringPhysician || 'Dr. V. Ramanathan, MD',
    status: 'DRAFT',
    observations: observations || {},
    findingsText: '',
    impressionText: [],
    previousDocumentId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1
  };

  documentsStore.unshift(newDoc);
  logAudit(newDoc.id, 'System API', 'CREATED', `Clinical document created for ${newDoc.patient.name} (${newDoc.templateName}).`, newDoc.tenantId);

  res.status(201).json({ document: newDoc });
});

// Update Document Observations or Text
app.put('/api/v1/documents/:id', (req, res) => {
  const index = documentsStore.findIndex(d => d.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const existing = documentsStore[index];
  const updated: ClinicalDocument = {
    ...existing,
    ...req.body,
    updatedAt: new Date().toISOString(),
    version: existing.version + 1
  };

  documentsStore[index] = updated;
  logAudit(updated.id, updated.practitioner?.name || 'Radiologist', 'EDITED', `Document updated to version ${updated.version}.`, updated.tenantId);

  res.json({ document: updated });
});

// AI Generation Trigger Endpoint
app.post('/api/v1/documents/:id/generate', async (req, res) => {
  const index = documentsStore.findIndex(d => d.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const doc = documentsStore[index];
  const template = RADIOLOGY_TEMPLATES.find(t => t.id === doc.templateId);
  const templateName = template ? template.name : doc.templateName;

  try {
    // 1. Generate Narrative Findings
    const findingsText = await generateNarrative(templateName, doc.modality, doc.observations);
    
    // 2. Suggest Impression
    const impressionText = await generateImpression(templateName, doc.observations, findingsText);

    // 3. Perform Consistency Check
    const consistencyCheck = await checkConsistency(doc.observations, findingsText, impressionText);

    // 4. Missing Info Check
    const missingInformation = await detectMissingInfo(templateName, doc.modality, doc.observations);

    // 5. Comparison Engine if previous document exists
    let comparativeAnalysis = undefined;
    if (doc.previousDocumentId) {
      const prevDoc = documentsStore.find(d => d.id === doc.previousDocumentId);
      if (prevDoc) {
        comparativeAnalysis = await compareWithPreviousReport(
          doc.observations,
          prevDoc.observations,
          doc.studyDate.split('T')[0],
          prevDoc.studyDate.split('T')[0]
        );
      }
    }

    const aiResults = {
      generatedNarrative: findingsText,
      suggestedImpression: impressionText,
      consistencyCheck,
      missingInformation,
      comparativeAnalysis
    };

    doc.findingsText = findingsText;
    doc.impressionText = impressionText;
    doc.aiResults = aiResults;
    doc.status = 'PRELIMINARY';
    doc.updatedAt = new Date().toISOString();
    doc.version += 1;

    documentsStore[index] = doc;
    logAudit(doc.id, 'AI Service Orchestrator', 'AI_DRAFT_GENERATED', 'Generated draft narrative, impressions, consistency audit, and missing info check.', doc.tenantId);

    res.json({ document: doc, aiResults });
  } catch (err: any) {
    res.status(500).json({ error: 'AI generation failed', message: err.message });
  }
});

// Validation Engine
app.post('/api/v1/documents/:id/validate', (req, res) => {
  const doc = documentsStore.find(d => d.id === req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // Rules Engine Validation
  if (!doc.findingsText || doc.findingsText.trim().length < 10) {
    errors.push('Findings text is empty or incomplete.');
  }

  if (!doc.impressionText || doc.impressionText.length === 0) {
    errors.push('Impression section is required before doctor signoff.');
  }

  if (doc.aiResults?.consistencyCheck?.isConsistent === false) {
    doc.aiResults.consistencyCheck.conflicts.forEach(conflict => {
      warnings.push(`Consistency Warning in [${conflict.field}]: ${conflict.expected} vs narrative '${conflict.narrativeText}'`);
    });
  }

  if (doc.aiResults?.missingInformation?.hasMissingInfo) {
    doc.aiResults.missingInformation.items.forEach(item => {
      warnings.push(`Incomplete Sequence/Data: ${item}`);
    });
  }

  const validation = {
    isValid: errors.length === 0,
    errors,
    warnings
  };

  doc.validation = validation;
  res.json({ validation });
});

// Doctor Approval
app.post('/api/v1/documents/:id/approve', (req, res) => {
  const { practitioner } = req.body;
  const index = documentsStore.findIndex(d => d.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const doc = documentsStore[index];
  doc.status = 'APPROVED';
  if (practitioner) doc.practitioner = practitioner;
  doc.updatedAt = new Date().toISOString();

  documentsStore[index] = doc;
  logAudit(doc.id, practitioner?.name || doc.practitioner?.name || 'Radiologist', 'APPROVED', 'Report reviewed and approved by radiologist.', doc.tenantId);

  res.json({ document: doc });
});

// Digital Signature Endpoint
app.post('/api/v1/documents/:id/sign', (req, res) => {
  const { practitioner, signatureImage } = req.body;
  const index = documentsStore.findIndex(d => d.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const doc = documentsStore[index];
  const p = practitioner || doc.practitioner || SAMPLE_PRACTITIONERS[0];

  const cryptoHash = `0x${Array.from({ length: 20 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

  doc.status = 'DIGITALLY_SIGNED';
  doc.practitioner = p;
  doc.digitalSignature = {
    signedBy: p.name,
    practitionerName: p.name,
    registrationNo: p.registrationNo,
    signedAt: new Date().toISOString(),
    hash: cryptoHash,
    signatureImage: signatureImage || p.signatureImage,
    certificateAuthority: 'National Health PKI Cryptographic Signer'
  };
  doc.updatedAt = new Date().toISOString();

  documentsStore[index] = doc;
  logAudit(doc.id, p.name, 'SIGNED', `Digitally signed with PKI seal (Hash: ${cryptoHash}).`, doc.tenantId);

  res.json({ document: doc, digitalSignature: doc.digitalSignature });
});

// FHIR R4 Export Endpoint
app.get('/api/v1/documents/:id/fhir', (req, res) => {
  const doc = documentsStore.find(d => d.id === req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const fhirBundle = convertToFHIRDiagnosticReport(doc);
  res.setHeader('Content-Type', 'application/fhir+json');
  res.json(fhirBundle);
});

// Voice Dictation to Structured Data Parser Endpoint
app.post('/api/v1/voice/parse', async (req, res) => {
  const { dictationText, templateId } = req.body;
  if (!dictationText) {
    return res.status(400).json({ error: 'dictationText is required' });
  }

  const template = RADIOLOGY_TEMPLATES.find(t => t.id === templateId) || RADIOLOGY_TEMPLATES[0];

  try {
    const extractedObservations = await parseVoiceDictationToObservations(dictationText, template.fields);
    res.json({ extractedObservations });
  } catch (err: any) {
    res.status(500).json({ error: 'Voice parsing failed', message: err.message });
  }
});

// Interactive RAG Chat Co-Pilot Endpoint
app.post('/api/v1/chat', async (req, res) => {
  const { message, document, templateId, ragEnabled } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  const template = RADIOLOGY_TEMPLATES.find(t => t.id === templateId) || RADIOLOGY_TEMPLATES[0];
  const doc = document || documentsStore[0];

  try {
    const chatResult = await processChatCoPilot(message, doc, template.fields, ragEnabled !== false);
    
    // If observations were extracted, update document store if document exists
    if (chatResult.extractedObservations && doc.id) {
      const idx = documentsStore.findIndex(d => d.id === doc.id);
      if (idx !== -1) {
        const currentDoc = documentsStore[idx];
        const updatedObs = { ...currentDoc.observations };
        
        Object.entries(chatResult.extractedObservations).forEach(([k, v]) => {
          if (typeof v === 'object' && v !== null && 'value' in v) {
            updatedObs[k] = v;
          } else {
            updatedObs[k] = { value: v };
          }
        });

        documentsStore[idx] = {
          ...currentDoc,
          observations: updatedObs,
          findingsText: chatResult.suggestedNarrative || currentDoc.findingsText,
          impressionText: chatResult.suggestedImpression || currentDoc.impressionText,
          updatedAt: new Date().toISOString()
        };
      }
    }

    res.json(chatResult);
  } catch (err: any) {
    res.status(500).json({ error: 'Chat co-pilot failed', message: err.message });
  }
});

// Audit Trail Endpoint
app.get('/api/v1/audit-logs', (req, res) => {
  res.json({ count: auditLogsStore.length, logs: auditLogsStore });
});

// Start Express + Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Chakkra Clinical Document API Server running on http://localhost:${PORT}`);
  });
}

startServer();
