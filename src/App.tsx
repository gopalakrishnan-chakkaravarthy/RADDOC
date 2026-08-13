import React, { useState, useEffect } from 'react';
import { ClinicalDocument, HospitalTenant, Practitioner, Patient, TemplateDefinition, Modality } from './types';
import {
  getTenants,
  updateTenant,
  createTenant,
  getPractitioners,
  getPatients,
  getTemplates,
  getDocuments,
  createDocument,
  updateDocument,
  triggerAIGeneration,
  validateDocument,
  approveDocument,
  signDocument,
  createPractitioner,
  updatePractitioner,
  deletePractitioner,
  getDataSourceConfig,
  toggleDataSource,
  runComparativeAnalysis
} from './services/api';
import { GlobalHttpLoader } from './components/GlobalHttpLoader';
import {
  SAMPLE_TENANTS,
  SAMPLE_PRACTITIONERS,
  SAMPLE_PATIENTS,
  HISTORICAL_DOCUMENTS
} from './data/sampleData';
import { RADIOLOGY_TEMPLATES } from './data/templates';

import { Navbar } from './components/Navbar';
import { ReportStudio } from './components/ReportStudio';
import { ClinicalQueue } from './components/ClinicalQueue';
import { ComparisonEngineView } from './components/ComparisonEngineView';
import { FhirInspectorView } from './components/FhirInspectorView';
import { ApiExplorer } from './components/ApiExplorer';
import { HospitalSettings } from './components/HospitalSettings';
import { AuditTrailView } from './components/AuditTrailView';
import { PdfReportPreview } from './components/PdfReportPreview';

export default function App() {
  const [tenants, setTenants] = useState<HospitalTenant[]>(SAMPLE_TENANTS);
  const [selectedTenant, setSelectedTenant] = useState<HospitalTenant>(SAMPLE_TENANTS[0]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>(SAMPLE_PRACTITIONERS);
  const [patients, setPatients] = useState<Patient[]>(SAMPLE_PATIENTS);
  const [templates, setTemplates] = useState<TemplateDefinition[]>(RADIOLOGY_TEMPLATES);
  const [documents, setDocuments] = useState<ClinicalDocument[]>(HISTORICAL_DOCUMENTS);
  const [activeDocument, setActiveDocument] = useState<ClinicalDocument>(HISTORICAL_DOCUMENTS[0]);
  const [activeTab, setActiveTab] = useState<string>('studio');
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [dataSourceMode, setDataSourceMode] = useState<{ useDatabaseData: boolean; dataSource: 'DATABASE' | 'SAMPLE'; dbConnected: boolean }>({
    useDatabaseData: false,
    dataSource: 'SAMPLE',
    dbConnected: false
  });

  useEffect(() => {
    async function initData() {
      try {
        const [tenantsData, practData, patData, tmplData, docsData, dsConfig] = await Promise.all([
          getTenants().catch(() => SAMPLE_TENANTS),
          getPractitioners().catch(() => SAMPLE_PRACTITIONERS),
          getPatients().catch(() => SAMPLE_PATIENTS),
          getTemplates().catch(() => RADIOLOGY_TEMPLATES),
          getDocuments().catch(() => HISTORICAL_DOCUMENTS),
          getDataSourceConfig().catch(() => ({ useDatabaseData: false, dataSource: 'SAMPLE' as const, dbConnected: false, config: {} }))
        ]);

        if (tenantsData && tenantsData.length > 0) {
          setTenants(tenantsData);
          setSelectedTenant(tenantsData[0]);
        }
        if (practData && practData.length > 0) setPractitioners(practData);
        if (patData && patData.length > 0) setPatients(patData);
        if (tmplData && tmplData.length > 0) setTemplates(tmplData);
        if (docsData && docsData.length > 0) {
          setDocuments(docsData);
          setActiveDocument(docsData[0]);
        }
        if (dsConfig) {
          setDataSourceMode({
            useDatabaseData: dsConfig.useDatabaseData,
            dataSource: dsConfig.dataSource,
            dbConnected: dsConfig.dbConnected
          });
        }
      } catch (err) {
        console.warn('API initialization warning, using offline fallback schema:', err);
      } finally {
        setLoading(false);
      }
    }

    initData();
  }, []);

  const handleToggleDataSource = async () => {
    try {
      setLoading(true);
      const res = await toggleDataSource();
      setDataSourceMode({
        useDatabaseData: res.useDatabaseData,
        dataSource: res.dataSource,
        dbConnected: res.dbConnected
      });

      // Reload fresh documents after data source toggle
      const freshDocs = await getDocuments();
      if (freshDocs && freshDocs.length > 0) {
        setDocuments(freshDocs);
        setActiveDocument(freshDocs[0]);
      }
    } catch (err) {
      console.error('Failed to toggle data source mode:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTenant = (tenant: HospitalTenant) => {
    setSelectedTenant(tenant);
  };

  const handleCreateNewStudy = async (patient: Patient, templateId: string, modality: string) => {
    try {
      const template = templates.find(t => t.id === templateId) || templates[0];
      const initialObs: Record<string, any> = {};
      
      // Populate defaults from template schema
      template.fields.forEach(field => {
        if (field.defaultValue !== undefined) {
          initialObs[field.id] = { value: field.defaultValue, unit: field.unit };
        } else if (field.type === 'boolean') {
          initialObs[field.id] = { value: false };
        } else if (field.type === 'select' && field.options && field.options.length > 0) {
          initialObs[field.id] = { value: field.options[0] };
        }
      });

      // Find historical doc for comparison if available
      const hist = documents.find(d => d.patient.patientId === patient.patientId && d.id !== 'new');
      
      const payload: Partial<ClinicalDocument> = {
        tenantId: selectedTenant.id,
        patient,
        templateId: template.id,
        modality: modality as Modality,
        accessionNumber: `ACC-${Math.floor(100000 + Math.random() * 900000)}`,
        referringPhysician: 'Dr. V. Ramanathan, MD (Gen Med)',
        observations: initialObs,
        previousDocumentId: hist ? hist.id : undefined
      };

      const newDoc = await createDocument(payload);
      setDocuments(prev => [newDoc, ...prev]);
      setActiveDocument(newDoc);
      setActiveTab('studio');
    } catch (err) {
      console.error('Failed to create new study:', err);
    }
  };

  const handleUpdateDocument = async (updatedFields: Partial<ClinicalDocument>) => {
    if (!activeDocument) return;
    try {
      const updated = await updateDocument(activeDocument.id, updatedFields);
      setActiveDocument(updated);
      setDocuments(prev => prev.map(d => d.id === updated.id ? updated : d));
    } catch (err) {
      console.error('Failed to update document:', err);
    }
  };

  const handleAIGenerate = async () => {
    if (!activeDocument) return;
    try {
      const res = await triggerAIGeneration(activeDocument.id);
      setActiveDocument(res.document);
      setDocuments(prev => prev.map(d => d.id === res.document.id ? res.document : d));
    } catch (err) {
      console.error('AI Generation error:', err);
    }
  };

  const handleRunComparativeAnalysis = async () => {
    if (!activeDocument || !activeDocument.previousDocumentId) return;
    try {
      setIsComparing(true);
      const res = await runComparativeAnalysis(activeDocument.id, activeDocument.previousDocumentId);
      setActiveDocument(res.document);
      setDocuments(prev => prev.map(d => d.id === res.document.id ? res.document : d));
    } catch (err) {
      console.error('Comparative Analysis Error:', err);
    } finally {
      setIsComparing(false);
    }
  };

  const handleValidate = async () => {
    if (!activeDocument) return;
    try {
      const res = await validateDocument(activeDocument.id);
      const updatedDoc = { ...activeDocument, validation: res.validation };
      setActiveDocument(updatedDoc);
    } catch (err) {
      console.error('Validation error:', err);
    }
  };

  const handleApprove = async () => {
    if (!activeDocument) return;
    try {
      const practitioner = practitioners[0];
      const updated = await approveDocument(activeDocument.id, practitioner);
      setActiveDocument(updated);
      setDocuments(prev => prev.map(d => d.id === updated.id ? updated : d));
    } catch (err) {
      console.error('Approval error:', err);
    }
  };

  const handleDigitalSign = async () => {
    if (!activeDocument) return;
    try {
      const practitioner = practitioners[0];
      const updated = await signDocument(activeDocument.id, practitioner);
      setActiveDocument(updated);
      setDocuments(prev => prev.map(d => d.id === updated.id ? updated : d));
    } catch (err) {
      console.error('Signing error:', err);
    }
  };

  const handleAddPractitioner = async (docData: Partial<Practitioner>) => {
    try {
      const created = await createPractitioner(docData);
      setPractitioners(prev => [...prev, created]);
    } catch (err) {
      console.error('Failed to add practitioner:', err);
      throw err;
    }
  };

  const handleUpdatePractitioner = async (id: string, updatedFields: Partial<Practitioner>) => {
    try {
      const updated = await updatePractitioner(id, updatedFields);
      setPractitioners(prev => prev.map(p => p.id === id ? updated : p));
      
      // Update active document if practitioner matches
      if (activeDocument && activeDocument.practitioner && activeDocument.practitioner.id === id) {
        setActiveDocument(prev => ({ ...prev, practitioner: updated }));
      }
    } catch (err) {
      console.error('Failed to update practitioner:', err);
      throw err;
    }
  };

  const handleDeletePractitioner = async (id: string) => {
    try {
      await deletePractitioner(id);
      setPractitioners(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete practitioner:', err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="font-bold text-slate-200 text-sm tracking-wide uppercase">Initializing Chakkra Clinical Intelligence Engine...</h2>
          <p className="text-xs text-slate-400">Loading Multi-Tenant Schema & FHIR R4 Microservices</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-800 relative">
      {/* Global HTTP API Activity Loader */}
      <GlobalHttpLoader />

      {/* Primary Header & Top Navigation Bar */}
      <Navbar
        tenants={tenants}
        selectedTenant={selectedTenant}
        onSelectTenant={handleSelectTenant}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeDocument={activeDocument}
        onOpenPdfModal={() => setShowPdfModal(true)}
        dataSourceMode={dataSourceMode}
        onToggleDataSource={handleToggleDataSource}
      />

      {/* Main Clinical Intelligence Engine Application Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {activeTab === 'studio' && activeDocument && (
          <ReportStudio
            document={activeDocument}
            tenant={selectedTenant}
            practitioners={practitioners}
            patients={patients}
            templates={templates}
            historicalDocuments={documents}
            onDocumentChange={(updatedDoc) => {
              setActiveDocument(updatedDoc);
              setDocuments(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
            }}
            onAIGenerate={handleAIGenerate}
            onValidate={handleValidate}
            onApprove={handleApprove}
            onDigitalSign={handleDigitalSign}
            onOpenPdfPreview={() => setShowPdfModal(true)}
          />
        )}

        {activeTab === 'queue' && (
          <ClinicalQueue
            documents={documents}
            patients={patients}
            templates={templates}
            activeDocId={activeDocument?.id}
            onSelectDocument={(doc) => {
              setActiveDocument(doc);
              setActiveTab('studio');
            }}
            onDocumentCreated={(newDoc) => {
              setDocuments(prev => [newDoc, ...prev]);
              setActiveDocument(newDoc);
              setActiveTab('studio');
            }}
          />
        )}

        {activeTab === 'comparison' && activeDocument && (
          <ComparisonEngineView
            currentDocument={activeDocument}
            historicalDocuments={documents}
            onSelectHistorical={(prevId) => {
              handleUpdateDocument({ previousDocumentId: prevId });
            }}
            onRunComparison={handleRunComparativeAnalysis}
            isComparing={isComparing}
          />
        )}

        {activeTab === 'fhir' && activeDocument && (
          <FhirInspectorView document={activeDocument} />
        )}

        {activeTab === 'audit' && (
          <AuditTrailView />
        )}

        {activeTab === 'api' && activeDocument && (
          <ApiExplorer document={activeDocument} />
        )}

        {activeTab === 'settings' && selectedTenant && (
          <HospitalSettings
            tenant={selectedTenant}
            tenants={tenants}
            onSelectTenant={handleSelectTenant}
            practitioners={practitioners}
            onUpdateTenant={async (updatedTenant) => {
              try {
                const saved = await updateTenant(updatedTenant.id, updatedTenant);
                setSelectedTenant(saved);
                setTenants(prev => prev.map(t => t.id === saved.id ? saved : t));
              } catch (err) {
                console.error('Failed to update tenant in DB:', err);
                setSelectedTenant(updatedTenant);
              }
            }}
            onAddTenant={async (newTenantData) => {
              try {
                const created = await createTenant(newTenantData);
                setTenants(prev => [...prev, created]);
                setSelectedTenant(created);
              } catch (err) {
                console.error('Failed to add tenant to DB:', err);
                throw err;
              }
            }}
            onAddPractitioner={handleAddPractitioner}
            onUpdatePractitioner={handleUpdatePractitioner}
            onDeletePractitioner={handleDeletePractitioner}
          />
        )}
      </main>

      {/* PDF Modal */}
      {showPdfModal && activeDocument && (
        <PdfReportPreview
          document={activeDocument}
          tenant={selectedTenant}
          onClose={() => setShowPdfModal(false)}
        />
      )}
    </div>
  );
}
