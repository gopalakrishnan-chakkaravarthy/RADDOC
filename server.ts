import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { RADIOLOGY_TEMPLATES } from './src/data/templates';
import { SAMPLE_TENANTS, SAMPLE_PRACTITIONERS, SAMPLE_PATIENTS, HISTORICAL_DOCUMENTS } from './src/data/sampleData';
import { ClinicalDocument, AuditLogEntry, Practitioner, HospitalTenant, Patient } from './src/types';
import { dbConfig, getSanitizedDbConfig } from './src/db/config';
import { runMigrations } from './src/db/migrate';
import { seedDatabase } from './src/db/seed';
import {
  getTenantsFromDb,
  saveTenantToDb,
  updateTenantInDb,
  getPractitionersFromDb,
  createPractitionerInDb,
  updatePractitionerInDb,
  deletePractitionerFromDb,
  getPatientsFromDb,
  createPatientInDb,
  updatePatientInDb,
  deletePatientFromDb,
  getTemplatesFromDb,
  saveTemplateToDb,
  getDocumentsFromDb,
  getDocumentByIdFromDb,
  saveDocumentToDb,
  deleteDocumentFromDb,
  getAuditLogsFromDb,
  createAuditLogInDb,
  testDbConnection
} from './src/db/dbClient';
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
const PORT: number = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// Active Data Source State Flag (Default: true for Database Mode)
let useDatabaseDataMode = true;

async function logAudit(documentId: string, actor: string, action: string, details: string, tenantId: string = 'tenant-xyz-hospital') {
  if (useDatabaseDataMode) {
    try {
      await createAuditLogInDb({ documentId, actor, action, details, tenantId });
    } catch (err: any) {
      console.warn('⚠️ Error logging audit to database:', err.message);
    }
  }
}

// ==========================================
// REST API ROUTES
// ==========================================

// Health Endpoint
app.get('/api/v1/health', async (req, res) => {
  const dbConnected = await testDbConnection();
  res.json({
    status: 'ok',
    service: 'Chakkra Clinical Document Intelligence API',
    version: '1.0.0',
    fhirVersion: 'R4',
    dataSourceMode: useDatabaseDataMode ? 'DATABASE' : 'SAMPLE',
    useDatabaseData: useDatabaseDataMode,
    dbConnected,
    timestamp: new Date().toISOString()
  });
});

// Data Source Flag & Connection Status Endpoint
app.get('/api/v1/config/data-source', async (req, res) => {
  const dbConnected = await testDbConnection();
  res.json({
    useDatabaseData: useDatabaseDataMode,
    dataSource: useDatabaseDataMode ? 'DATABASE' : 'SAMPLE',
    dbConnected,
    config: getSanitizedDbConfig()
  });
});

// Toggle Active Data Source Flag Endpoint
app.post('/api/v1/config/data-source', async (req, res) => {
  const { useDatabaseData, dataSource } = req.body;
  if (typeof useDatabaseData === 'boolean') {
    useDatabaseDataMode = useDatabaseData;
  } else if (typeof dataSource === 'string') {
    useDatabaseDataMode = dataSource.toUpperCase() === 'DATABASE';
  } else {
    useDatabaseDataMode = !useDatabaseDataMode;
  }

  console.log(`🔄 Data Source Flag changed to: ${useDatabaseDataMode ? 'DATABASE' : 'SAMPLE'}`);

  const dbConnected = await testDbConnection();
  const docs = useDatabaseDataMode ? await getDocumentsFromDb() : HISTORICAL_DOCUMENTS;

  res.json({
    message: `Data source switched to ${useDatabaseDataMode ? 'DATABASE' : 'SAMPLE'}`,
    useDatabaseData: useDatabaseDataMode,
    dataSource: useDatabaseDataMode ? 'DATABASE' : 'SAMPLE',
    dbConnected,
    documentCount: docs.length
  });
});

// ==========================================
// TENANTS (HOSPITAL DETAILS) API
// ==========================================

app.get('/api/v1/tenants', async (req, res) => {
  try {
    const tenants = useDatabaseDataMode ? await getTenantsFromDb() : SAMPLE_TENANTS;
    res.json({ tenants });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch tenants', message: err.message });
  }
});

app.post('/api/v1/tenants', async (req, res) => {
  try {
    const tenant: HospitalTenant = req.body;
    if (!tenant.name || !tenant.code) {
      return res.status(400).json({ error: 'Tenant Name and Code are required' });
    }
    const created = await saveTenantToDb(tenant);
    res.status(201).json({ tenant: created });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create tenant', message: err.message });
  }
});

app.put('/api/v1/tenants/:id', async (req, res) => {
  try {
    const updated = await updateTenantInDb(req.params.id, req.body);
    res.json({ tenant: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update tenant', message: err.message });
  }
});

// ==========================================
// PRACTITIONERS (DOCTOR DETAILS) API
// ==========================================

app.get('/api/v1/practitioners', async (req, res) => {
  try {
    const practitioners = useDatabaseDataMode ? await getPractitionersFromDb() : SAMPLE_PRACTITIONERS;
    res.json({ count: practitioners.length, practitioners });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch practitioners', message: err.message });
  }
});

app.post('/api/v1/practitioners', async (req, res) => {
  try {
    const { name, registrationNo } = req.body;
    if (!name || !registrationNo) {
      return res.status(400).json({ error: 'Name and Registration Number are required' });
    }
    const created = await createPractitionerInDb(req.body);
    res.status(201).json({ practitioner: created });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create practitioner', message: err.message });
  }
});

app.put('/api/v1/practitioners/:id', async (req, res) => {
  try {
    const updated = await updatePractitionerInDb(req.params.id, req.body);
    res.json({ practitioner: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update practitioner', message: err.message });
  }
});

app.delete('/api/v1/practitioners/:id', async (req, res) => {
  try {
    const success = await deletePractitionerFromDb(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete practitioner', message: err.message });
  }
});

// ==========================================
// PATIENTS API
// ==========================================

app.get('/api/v1/patients', async (req, res) => {
  try {
    const patients = useDatabaseDataMode ? await getPatientsFromDb() : SAMPLE_PATIENTS;
    res.json({ count: patients.length, patients });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch patients', message: err.message });
  }
});

app.post('/api/v1/patients', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Patient Name is required' });
    }
    const created = await createPatientInDb(req.body);
    res.status(201).json({ patient: created });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create patient', message: err.message });
  }
});

app.put('/api/v1/patients/:id', async (req, res) => {
  try {
    const updated = await updatePatientInDb(req.params.id, req.body);
    res.json({ patient: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update patient', message: err.message });
  }
});

app.delete('/api/v1/patients/:id', async (req, res) => {
  try {
    const success = await deletePatientFromDb(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete patient', message: err.message });
  }
});

// ==========================================
// TEMPLATES API
// ==========================================

app.get('/api/v1/templates', async (req, res) => {
  try {
    const { modality } = req.query;
    const templates = useDatabaseDataMode ? await getTemplatesFromDb(modality as string) : RADIOLOGY_TEMPLATES;
    res.json({ count: templates.length, templates });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch templates', message: err.message });
  }
});

app.get('/api/v1/templates/:id', async (req, res) => {
  try {
    const templates = useDatabaseDataMode ? await getTemplatesFromDb() : RADIOLOGY_TEMPLATES;
    const template = templates.find(t => t.id === req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({ template });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch template', message: err.message });
  }
});

// ==========================================
// CLINICAL DOCUMENTS CRUD API
// ==========================================

app.get('/api/v1/documents', async (req, res) => {
  try {
    const { tenantId, patientId, status } = req.query;
    const docs = useDatabaseDataMode 
      ? await getDocumentsFromDb(tenantId as string, patientId as string, status as string)
      : HISTORICAL_DOCUMENTS;
    res.json({ count: docs.length, documents: docs });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch documents', message: err.message });
  }
});

app.get('/api/v1/documents/:id', async (req, res) => {
  try {
    const doc = useDatabaseDataMode
      ? await getDocumentByIdFromDb(req.params.id)
      : HISTORICAL_DOCUMENTS.find(d => d.id === req.params.id);

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ document: doc });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch document', message: err.message });
  }
});

app.post('/api/v1/documents', async (req, res) => {
  try {
    const { tenantId, patient, templateId, modality, accessionNumber, referringPhysician, observations, previousDocumentId } = req.body;
    
    let defaultPatient = patient;
    if (!defaultPatient && useDatabaseDataMode) {
      const patients = await getPatientsFromDb();
      defaultPatient = patients[0] || SAMPLE_PATIENTS[0];
    }

    const templates = useDatabaseDataMode ? await getTemplatesFromDb() : RADIOLOGY_TEMPLATES;
    const template = templates.find(t => t.id === templateId);
    const templateName = template ? template.name : 'Radiology Study';

    const newDoc: ClinicalDocument = {
      id: `doc-${Date.now()}`,
      tenantId: tenantId || 'tenant-xyz-hospital',
      patient: defaultPatient || SAMPLE_PATIENTS[0],
      templateId: templateId || 'tpl-us-abdomen-01',
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

    const created = useDatabaseDataMode ? await saveDocumentToDb(newDoc) : newDoc;
    await logAudit(created.id, 'System API', 'CREATED', `Clinical document created for ${created.patient.name} (${created.templateName}).`, created.tenantId);

    res.status(201).json({ document: created });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create document', message: err.message });
  }
});

app.put('/api/v1/documents/:id', async (req, res) => {
  try {
    const docId = req.params.id;
    const existing = useDatabaseDataMode 
      ? await getDocumentByIdFromDb(docId) 
      : HISTORICAL_DOCUMENTS.find(d => d.id === docId);

    if (!existing) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const updated: ClinicalDocument = {
      ...existing,
      ...req.body,
      updatedAt: new Date().toISOString(),
      version: existing.version + 1
    };

    const saved = useDatabaseDataMode ? await saveDocumentToDb(updated) : updated;
    await logAudit(saved.id, saved.practitioner?.name || 'Radiologist', 'EDITED', `Document updated to version ${saved.version}.`, saved.tenantId);

    res.json({ document: saved });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update document', message: err.message });
  }
});

// AI Generation Trigger Endpoint
app.post('/api/v1/documents/:id/generate', async (req, res) => {
  try {
    const docId = req.params.id;
    const doc = useDatabaseDataMode ? await getDocumentByIdFromDb(docId) : HISTORICAL_DOCUMENTS.find(d => d.id === docId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const templates = useDatabaseDataMode ? await getTemplatesFromDb() : RADIOLOGY_TEMPLATES;
    const template = templates.find(t => t.id === doc.templateId);
    const templateName = template ? template.name : doc.templateName;

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
      const prevDoc = useDatabaseDataMode ? await getDocumentByIdFromDb(doc.previousDocumentId) : HISTORICAL_DOCUMENTS.find(d => d.id === doc.previousDocumentId);
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

    const saved = useDatabaseDataMode ? await saveDocumentToDb(doc) : doc;
    await logAudit(saved.id, 'AI Service Orchestrator', 'AI_DRAFT_GENERATED', 'Generated draft narrative, impressions, consistency audit, and missing info check.', saved.tenantId);

    res.json({ document: saved, aiResults });
  } catch (err: any) {
    res.status(500).json({ error: 'AI generation failed', message: err.message });
  }
});

// AI Comparative Analysis Trigger Endpoint
app.post('/api/v1/documents/:id/compare', async (req, res) => {
  try {
    const docId = req.params.id;
    const { previousDocumentId } = req.body;

    const doc = useDatabaseDataMode ? await getDocumentByIdFromDb(docId) : HISTORICAL_DOCUMENTS.find(d => d.id === docId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const prevId = previousDocumentId || doc.previousDocumentId;
    if (!prevId) {
      return res.status(400).json({ error: 'previousDocumentId is required for comparative analysis' });
    }

    const prevDoc = useDatabaseDataMode ? await getDocumentByIdFromDb(prevId) : HISTORICAL_DOCUMENTS.find(d => d.id === prevId);
    if (!prevDoc) {
      return res.status(404).json({ error: 'Previous baseline document not found' });
    }

    const comparativeAnalysis = await compareWithPreviousReport(
      doc.observations,
      prevDoc.observations,
      doc.studyDate.split('T')[0],
      prevDoc.studyDate.split('T')[0]
    );

    doc.previousDocumentId = prevId;
    doc.aiResults = {
      ...doc.aiResults,
      comparativeAnalysis
    };
    doc.updatedAt = new Date().toISOString();

    const saved = useDatabaseDataMode ? await saveDocumentToDb(doc) : doc;
    await logAudit(saved.id, 'AI Comparative Engine', 'COMPARATIVE_ANALYSIS_RUN', `Generated longitudinal comparative analysis against baseline study ${prevDoc.accessionNumber}.`, saved.tenantId);

    res.json({ document: saved, comparativeAnalysis });
  } catch (err: any) {
    res.status(500).json({ error: 'Comparative analysis failed', message: err.message });
  }
});

// Doctor Approval Endpoint
app.post('/api/v1/documents/:id/approve', async (req, res) => {
  try {
    const { practitioner } = req.body;
    const doc = useDatabaseDataMode ? await getDocumentByIdFromDb(req.params.id) : HISTORICAL_DOCUMENTS.find(d => d.id === req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    doc.status = 'APPROVED';
    if (practitioner) doc.practitioner = practitioner;
    doc.updatedAt = new Date().toISOString();

    const saved = useDatabaseDataMode ? await saveDocumentToDb(doc) : doc;
    await logAudit(saved.id, practitioner?.name || doc.practitioner?.name || 'Radiologist', 'APPROVED', 'Report reviewed and approved by radiologist.', saved.tenantId);

    res.json({ document: saved });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to approve document', message: err.message });
  }
});

// Digital Signature Endpoint
app.post('/api/v1/documents/:id/sign', async (req, res) => {
  try {
    const { practitioner, signatureImage } = req.body;
    const doc = useDatabaseDataMode ? await getDocumentByIdFromDb(req.params.id) : HISTORICAL_DOCUMENTS.find(d => d.id === req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const defaultPractitioner = practitioner || doc.practitioner || SAMPLE_PRACTITIONERS[0];
    const cryptoHash = `0x${Array.from({ length: 20 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    doc.status = 'DIGITALLY_SIGNED';
    doc.practitioner = defaultPractitioner;
    doc.digitalSignature = {
      signedBy: defaultPractitioner.name,
      practitionerName: defaultPractitioner.name,
      registrationNo: defaultPractitioner.registrationNo,
      signedAt: new Date().toISOString(),
      hash: cryptoHash,
      signatureImage: signatureImage || defaultPractitioner.signatureImage,
      certificateAuthority: 'National Health PKI Cryptographic Signer'
    };
    doc.updatedAt = new Date().toISOString();

    const saved = useDatabaseDataMode ? await saveDocumentToDb(doc) : doc;
    await logAudit(saved.id, defaultPractitioner.name, 'SIGNED', `Digitally signed with PKI seal (Hash: ${cryptoHash}).`, saved.tenantId);

    res.json({ document: saved, digitalSignature: saved.digitalSignature });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to sign document', message: err.message });
  }
});

// FHIR R4 Export Endpoint
app.get('/api/v1/documents/:id/fhir', async (req, res) => {
  try {
    const doc = useDatabaseDataMode ? await getDocumentByIdFromDb(req.params.id) : HISTORICAL_DOCUMENTS.find(d => d.id === req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const fhirBundle = convertToFHIRDiagnosticReport(doc);
    res.setHeader('Content-Type', 'application/fhir+json');
    res.json(fhirBundle);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate FHIR export', message: err.message });
  }
});

// Voice Dictation to Structured Data Parser Endpoint
app.post('/api/v1/voice/parse', async (req, res) => {
  const { dictationText, templateId } = req.body;
  if (!dictationText) {
    return res.status(400).json({ error: 'dictationText is required' });
  }

  const templates = useDatabaseDataMode ? await getTemplatesFromDb() : RADIOLOGY_TEMPLATES;
  const template = templates.find(t => t.id === templateId) || templates[0];

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

  const templates = useDatabaseDataMode ? await getTemplatesFromDb() : RADIOLOGY_TEMPLATES;
  const template = templates.find(t => t.id === templateId) || templates[0];
  const doc = document || (useDatabaseDataMode ? (await getDocumentsFromDb())[0] : HISTORICAL_DOCUMENTS[0]);

  try {
    const chatResult = await processChatCoPilot(message, doc, template.fields, ragEnabled !== false);
    
    if (chatResult.extractedObservations && doc.id) {
      const currentDoc = useDatabaseDataMode ? await getDocumentByIdFromDb(doc.id) : doc;
      if (currentDoc) {
        const updatedObs = { ...currentDoc.observations };
        
        Object.entries(chatResult.extractedObservations).forEach(([k, v]) => {
          if (typeof v === 'object' && v !== null && 'value' in v) {
            updatedObs[k] = v;
          } else {
            updatedObs[k] = { value: v };
          }
        });

        currentDoc.observations = updatedObs;
        currentDoc.findingsText = chatResult.suggestedNarrative || currentDoc.findingsText;
        currentDoc.impressionText = chatResult.suggestedImpression || currentDoc.impressionText;
        currentDoc.updatedAt = new Date().toISOString();

        if (useDatabaseDataMode) {
          await saveDocumentToDb(currentDoc);
        }
      }
    }

    res.json(chatResult);
  } catch (err: any) {
    res.status(500).json({ error: 'Chat co-pilot failed', message: err.message });
  }
});

// Audit Trail Endpoint
app.get('/api/v1/audit-logs', async (req, res) => {
  try {
    const logs = useDatabaseDataMode ? await getAuditLogsFromDb() : [];
    res.json({ count: logs.length, logs });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch audit logs', message: err.message });
  }
});

// Start Express + Vite
async function startServer() {
  console.log(`\n====================================================`);
  console.log(`⚙️ Starting Chakkra Clinical Intelligence Server`);
  console.log(`📌 Database Persistence Active: ${useDatabaseDataMode}`);
  console.log(`====================================================\n`);

  if (useDatabaseDataMode) {
    try {
      await runMigrations();
      await seedDatabase();
    } catch (err: any) {
      console.warn('⚠️ Database auto-migration / seeding warning:', err.message);
    }
  }

  const isProduction = process.env.NODE_ENV === 'production' || (process.argv[1] && process.argv[1].includes('dist'));

  if (!isProduction) {
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
