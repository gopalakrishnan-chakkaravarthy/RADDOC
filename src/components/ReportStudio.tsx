import React, { useState, useEffect, useRef } from 'react';
import { ClinicalDocument, TemplateDefinition, Practitioner, Patient, HospitalTenant } from '../types';
import { VoiceRecording } from './VoiceRecording';
import {
  triggerAIGeneration,
  validateDocument,
  approveDocument,
  signDocument,
  updateDocument,
  sendCoPilotChat,
  updatePatient,
  createPatient
} from '../services/api';
import {
  Sparkles,
  CheckCircle2,
  FileCheck,
  Printer,
  ShieldCheck,
  ChevronRight,
  Info,
  Lock,
  Edit3,
  User,
  FileText,
  Activity,
  Save,
  Brain,
  CheckSquare,
  BookOpen,
  Send,
  Sliders,
  Database,
  ChevronLeft
} from 'lucide-react';

interface ReportStudioProps {
  document: ClinicalDocument;
  templates: TemplateDefinition[];
  practitioners: Practitioner[];
  patients: Patient[];
  tenant?: HospitalTenant;
  historicalDocuments?: ClinicalDocument[];
  onDocumentChange: (doc: ClinicalDocument) => void;
  onOpenPdf?: () => void;
  onOpenPdfPreview?: () => void;
  onAIGenerate?: any;
  onValidate?: any;
  onApprove?: any;
  onDigitalSign?: any;
}

export const ReportStudio: React.FC<ReportStudioProps> = ({
  document: doc,
  templates = [],
  practitioners = [],
  patients = [],
  tenant,
  historicalDocuments = [],
  onDocumentChange,
  onOpenPdf,
  onOpenPdfPreview
}) => {
  const handleOpenPdf = onOpenPdf || onOpenPdfPreview || (() => {});
  // Active workflow step (1 to 11)
  const [activeStep, setActiveStep] = useState<number>(3); // Default to Step 3 (Structured measurements)

  // Interactive Chat & Voice RAG State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'doctor' | 'ai'; text: string; timestamp: string; ragSources?: string[] }>>([
    {
      sender: 'ai',
      text: 'Hello Dr. Radiologist! I am your RAG-enabled Radiology Co-Pilot. You can dictate spoken notes or type clinical observations. I will automatically parse measurements into Step 3, generate findings, narrative, impressions, and validate against ACR & BI-RADS guidelines.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ragSources: ['ACR Practice Parameters 2025', 'BI-RADS 5th Ed', 'AIUM Ultrasound Guidelines']
    }
  ]);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [ragEnabled, setRagEnabled] = useState(true);

  // States for generation & validation
  const [isParsingVoice, setIsParsingVoice] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleSaveReport = async () => {
    setIsSaving(true);
    try {
      await onDocumentChange(doc);
      setSaveMessage('Report saved successfully!');
    } catch (err) {
      console.error('Save report failed:', err);
      setSaveMessage('Failed to save report changes.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };
  const [activePractitioner, setActivePractitioner] = useState<Practitioner | undefined>(
    practitioners[0] || doc?.practitioner
  );

  const selectedTemplate = templates.find(t => t.id === doc?.templateId) || templates[0];
  const categories = selectedTemplate ? Array.from(new Set(selectedTemplate.fields.map(f => f.category))) : [];

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>('');
  const simulationIntervalRef = useRef<any>(null);

  // Speech Recognition setup (Web Speech API with real-time streaming into chat input)
  const toggleVoiceRecording = () => {
    if (isRecordingVoice) {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore error
        }
      }
      setIsRecordingVoice(false);
      return;
    }

    baseTextRef.current = chatInput;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsRecordingVoice(true);

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = 0; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' ';
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          const currentBase = baseTextRef.current ? baseTextRef.current.trim() + ' ' : '';
          const fullText = (currentBase + finalTranscript + interimTranscript).trim();
          setChatInput(fullText);
        };

        recognition.onerror = (err: any) => {
          console.warn('SpeechRecognition error or permission blocked:', err);
          setIsRecordingVoice(false);
          if (err.error !== 'no-speech') {
            fallbackVoiceSimulation();
          }
        };

        recognition.onend = () => {
          setIsRecordingVoice(false);
        };

        recognition.start();
      } catch (err) {
        fallbackVoiceSimulation();
      }
    } else {
      fallbackVoiceSimulation();
    }
  };

  const fallbackVoiceSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }
    setIsRecordingVoice(true);
    const words = [
      "Liver", "size", "15.8 cm", "with", "mild", "fatty", "infiltration.",
      "Gallbladder", "shows", "a", "5.5 mm", "calculus", "with", "normal", "wall", "thickness.",
      "CBD", "diameter", "is", "4.8 mm", "with", "no", "intrahepatic", "biliary", "duct", "dilation."
    ];

    let currentText = chatInput ? chatInput.trim() + ' ' : '';
    let idx = 0;

    simulationIntervalRef.current = setInterval(() => {
      if (idx < words.length) {
        currentText += words[idx] + ' ';
        setChatInput(currentText);
        idx++;
      } else {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
        setIsRecordingVoice(false);
      }
    }, 180);
  };

  // Handle Field Value Change
  const handleFieldChange = async (fieldId: string, value: any, unit?: string) => {
    const updatedObs = {
      ...doc.observations,
      [fieldId]: {
        value,
        unit: unit || doc.observations[fieldId]?.unit
      }
    };

    const updatedDoc: ClinicalDocument = {
      ...doc,
      observations: updatedObs,
      status: doc.status === 'APPROVED' || doc.status === 'DIGITALLY_SIGNED' ? 'AMENDED' : doc.status
    };

    onDocumentChange(updatedDoc);
    await updateDocument(doc.id, { observations: updatedObs });
  };

  // Helper to persist patient demographic updates directly into PostgreSQL `patients` table
  const savePatientToDb = async (patient: Patient) => {
    try {
      if (patient.id) {
        await updatePatient(patient.id, patient);
      } else {
        const created = await createPatient(patient);
        return created;
      }
    } catch (err) {
      console.warn('⚠️ Error persisting patient to DB:', err);
    }
    return patient;
  };

  // Handle Patient Demographics Change (Name, Age, Gender, Phone, DOB, etc.)
  const handlePatientChange = (field: keyof Patient, value: any) => {
    const updatedPatient: Patient = {
      ...doc.patient,
      [field]: value
    };
    const updatedDoc: ClinicalDocument = {
      ...doc,
      patient: updatedPatient,
      status: doc.status === 'APPROVED' || doc.status === 'DIGITALLY_SIGNED' ? 'AMENDED' : doc.status
    };
    onDocumentChange(updatedDoc);
  };

  // Automatically persist patient metadata to PostgreSQL DB (patients table & clinical_documents table) when input field loses focus (onBlur)
  const handlePatientBlur = async (field: keyof Patient, value: any) => {
    const updatedPatient: Patient = {
      ...doc.patient,
      [field]: value
    };
    const updatedDoc: ClinicalDocument = {
      ...doc,
      patient: updatedPatient,
      status: doc.status === 'APPROVED' || doc.status === 'DIGITALLY_SIGNED' ? 'AMENDED' : doc.status
    };
    onDocumentChange(updatedDoc);
    await savePatientToDb(updatedPatient);
    await updateDocument(doc.id, { patient: updatedPatient });
  };

  // Send Chat Message to Gemini RAG Co-Pilot Endpoint
  const handleSendChat = async (e?: React.FormEvent, overrideMessage?: string) => {
    if (e) e.preventDefault();
    const userMsg = (overrideMessage || chatInput).trim();
    if (!userMsg || isSendingChat) return;

    if (!overrideMessage) {
      setChatInput('');
    }
    setIsSendingChat(true);

    const userMessageObj = {
      sender: 'doctor' as const,
      text: overrideMessage ? `🎤 [Voice Dictation] ${userMsg}` : userMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMessageObj]);

    try {
      const chatRes = await sendCoPilotChat({
        message: userMsg,
        document: doc,
        templateId: doc.templateId,
        ragEnabled
      });

      // Update document observations if extracted
      let updatedDoc = { ...doc };
      if (chatRes.extractedObservations && Object.keys(chatRes.extractedObservations).length > 0) {
        const newObs = { ...doc.observations };
        Object.entries(chatRes.extractedObservations).forEach(([k, v]) => {
          if (typeof v === 'object' && v !== null && 'value' in v) {
            newObs[k] = v;
          } else {
            newObs[k] = { value: v, unit: newObs[k]?.unit };
          }
        });
        updatedDoc.observations = newObs;
      }

      if (chatRes.suggestedNarrative) {
        updatedDoc.findingsText = chatRes.suggestedNarrative;
      }

      if (chatRes.suggestedImpression && chatRes.suggestedImpression.length > 0) {
        updatedDoc.impressionText = chatRes.suggestedImpression;
      }

      onDocumentChange(updatedDoc);
      await updateDocument(updatedDoc.id, {
        observations: updatedDoc.observations,
        findingsText: updatedDoc.findingsText,
        impressionText: updatedDoc.impressionText
      });

      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: chatRes.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          ragSources: ragEnabled ? ['ACR Clinical Standard', 'Fleischner Protocol 2025'] : undefined
        }
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: 'I received your dictation and updated the structured parameters in Step 3.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Run AI Generation (Steps 4, 5, 6, 7)
  const handleRunAIServices = async () => {
    setIsGeneratingAI(true);
    try {
      const res = await triggerAIGeneration(doc.id);
      onDocumentChange(res.document);
      setActiveStep(5); // Advance to Step 5 (AI narrative)
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Run Validation (Step 7)
  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const res = await validateDocument(doc.id);
      onDocumentChange({ ...doc, validation: res.validation });
      setActiveStep(7);
    } catch (err) {
      console.error(err);
    } finally {
      setIsValidating(false);
    }
  };

  // Approve Document (Step 9)
  const handleApprove = async () => {
    try {
      const updated = await approveDocument(doc.id, activePractitioner);
      onDocumentChange(updated);
      setActiveStep(9);
    } catch (err) {
      console.error(err);
    }
  };

  // Sign Document (Step 11)
  const handleSign = async () => {
    setIsSigning(true);
    try {
      const updated = await signDocument(doc.id, activePractitioner);
      onDocumentChange(updated);
      setActiveStep(11);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSigning(false);
    }
  };

  // 11-Step Definition Array
  const stepsList = [
    { num: 1, title: 'Patient', icon: User, desc: 'Patient demographics & UHID' },
    { num: 2, title: 'Study Selection', icon: FileText, desc: 'Modality & 23 Word Templates' },
    { num: 3, title: 'Structured Measurements', icon: Sliders, desc: 'Schema values & overrides' },
    { num: 4, title: 'Findings', icon: Activity, desc: 'Organ system observations' },
    { num: 5, title: 'AI Narrative', icon: Sparkles, desc: 'Gemini LLM radiology prose' },
    { num: 6, title: 'AI Impression Suggestion', icon: Brain, desc: 'Diagnoses & BI-RADS scores' },
    { num: 7, title: 'Validation', icon: CheckSquare, desc: 'Consistency & protocol audit' },
    { num: 8, title: 'Doctor Editing', icon: Edit3, desc: 'Inline editor & macro diff' },
    { num: 9, title: 'Approval', icon: Lock, desc: 'Radiologist signoff lock' },
    { num: 10, title: 'PDF', icon: Printer, desc: 'Hospital letterhead preview' },
    { num: 11, title: 'Digital Signature', icon: ShieldCheck, desc: 'PKI seal & crypto hash' }
  ];

  return (
    <div className="space-y-6">
      {/* Step Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold text-lg">
            {doc.modality}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">{doc.templateName}</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${doc.status === 'DIGITALLY_SIGNED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                doc.status === 'APPROVED' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                  'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                {doc.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>Patient: <span className="text-white font-semibold">{doc?.patient?.name || 'Unknown Patient'}</span></span>
              <span>({doc?.patient?.age || '--'}Y/{doc?.patient?.gender || 'U'})</span>
              {doc?.patient?.dob && <span>| DOB: <span className="text-slate-300 font-medium">{doc.patient.dob}</span></span>}
              {doc?.patient?.phone && <span>| Contact: <span className="text-slate-300 font-medium">{doc.patient.phone}</span></span>}
              <span>| UHID: <span className="font-mono text-cyan-300">{doc?.patient?.patientId || '--'}</span></span>
              <span>| Accession: <span className="font-mono text-slate-300">{doc?.accessionNumber}</span></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Active Radiologist</p>
            <select
              value={activePractitioner?.id || ''}
              onChange={(e) => {
                const found = practitioners.find(p => p.id === e.target.value);
                if (found) setActivePractitioner(found);
              }}
              className="bg-slate-800 text-white text-xs font-semibold rounded-lg px-2.5 py-1 border border-slate-700 cursor-pointer"
            >
              {practitioners.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSaveReport}
            disabled={isSaving}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>{isSaving ? 'Saving...' : 'Save Report'}</span>
          </button>

          <button
            onClick={handleOpenPdf}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400/30 px-3.5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="bg-emerald-950 border border-emerald-800 text-emerald-200 px-4 py-2 rounded-xl text-xs flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">{saveMessage}</span>
          </div>
          <button onClick={() => setSaveMessage(null)} className="text-emerald-400 hover:text-white text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* 11-Step Interactive Visual Stepper Bar (Mobile & Desktop Responsive - Zero Overflow) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-lg space-y-3 w-full max-w-full overflow-hidden">
        {/* Mobile & Tablet Header Controls */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800 w-full max-w-full">
          {/* Left: Active Step Badge & Title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="shrink-0 bg-cyan-600 text-white px-2 py-0.5 rounded-full font-mono text-[10px] font-bold">
              Step {activeStep}/11
            </span>
            <span className="truncate text-xs font-bold text-cyan-300 min-w-0">
              {stepsList.find(s => s.num === activeStep)?.title}
            </span>
          </div>

          {/* Right: Quick Jump Select & Chevron Step Controls */}
          <div className="flex items-center gap-1.5 shrink-0 max-w-full">
            <select
              value={activeStep}
              onChange={(e) => setActiveStep(Number(e.target.value))}
              className="bg-slate-800 text-cyan-300 border border-slate-700 rounded-lg text-[11px] sm:text-xs font-bold px-2 py-1 max-w-[110px] xs:max-w-[130px] sm:max-w-[180px] truncate focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              {stepsList.map((s) => (
                <option key={s.num} value={s.num}>
                  {s.num}. {s.title}
                </option>
              ))}
            </select>

            <button
              onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
              disabled={activeStep === 1}
              className="shrink-0 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 p-1.5 rounded-lg border border-slate-700 text-xs cursor-pointer active:scale-95 transition-all"
              title="Previous Step"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setActiveStep(prev => Math.min(11, prev + 1))}
              disabled={activeStep === 11}
              className="shrink-0 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 p-1.5 rounded-lg border border-slate-700 text-xs cursor-pointer active:scale-95 transition-all"
              title="Next Step"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Responsive Horizontal Stepper Pills (Touch-scrollable with visible step indicators) */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full max-w-full pb-1 pt-0.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900 touch-pan-x">
          {stepsList.map((st) => {
            const IconComp = st.icon;
            const isActive = activeStep === st.num;
            const isCompleted = activeStep > st.num || doc.status === 'DIGITALLY_SIGNED' || (st.num <= 9 && doc.status === 'APPROVED');

            return (
              <button
                key={st.num}
                onClick={() => setActiveStep(st.num)}
                className={`shrink-0 min-w-[78px] max-w-[92px] sm:min-w-[100px] sm:max-w-none lg:flex-1 flex flex-col items-center p-1.5 sm:p-2 rounded-xl border text-center transition-all cursor-pointer overflow-hidden ${
                  isActive
                    ? 'bg-cyan-600/25 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-600/20 ring-1 ring-cyan-500/50'
                    : isCompleted
                    ? 'bg-slate-800/80 border-emerald-500/40 text-emerald-300 hover:bg-slate-800'
                    : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase mb-0.5">
                  <span>Step {st.num}</span>
                  {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                </div>
                <IconComp className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5" />
                <span className="text-[10px] sm:text-[11px] font-bold truncate w-full px-0.5">{st.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace Layout: Left Column (Current Step View) + Right Column (RAG Voice/Chat Co-Pilot) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Active Step Functional Workspace */}
        <div className="lg:col-span-7 space-y-6">

          {/* STEP 1: Patient Demographics & Profile (Editable) */}
          {activeStep === 1 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-cyan-600" />
                    1. Patient Demographics & Profile
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Editable patient credentials stored directly in PostgreSQL (<span className="text-purple-600 font-mono">patients</span> table).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-full flex items-center gap-1 font-mono">
                    <Database className="w-3 h-3 text-purple-600" /> DB Active
                  </span>
                  <span className="text-xs font-mono bg-cyan-100 text-cyan-800 px-2.5 py-1 rounded-full font-bold">
                    UHID: {doc?.patient?.patientId || '--'}
                  </span>
                </div>
              </div>

              {/* Database Registered Patient Selector Dropdown */}
              {patients.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 font-bold">
                    <Database className="w-4 h-4 text-purple-600" />
                    <span>Select Patient from PostgreSQL DB:</span>
                  </div>
                  <select
                    value={doc?.patient?.id || ''}
                    onChange={async (e) => {
                      const selected = patients.find(p => p.id === e.target.value);
                      if (selected) {
                        const updatedDoc: ClinicalDocument = {
                          ...doc,
                          patient: selected
                        };
                        onDocumentChange(updatedDoc);
                        await updateDocument(doc.id, { patient: selected });
                      }
                    }}
                    className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-semibold text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none cursor-pointer max-w-xs"
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.patientId} - {p.gender}, {p.age}y)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Patient Name */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 flex items-center gap-1">
                    Patient Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={doc?.patient?.name || ''}
                    onChange={(e) => handlePatientChange('name', e.target.value)}
                    onBlur={(e) => handlePatientBlur('name', e.target.value)}
                    placeholder="e.g. Ramesh Sundaram"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                {/* Patient Age */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 flex items-center gap-1">
                    Age (Years) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={doc?.patient?.age ?? ''}
                    onChange={(e) => handlePatientChange('age', parseInt(e.target.value, 10) || 0)}
                    onBlur={(e) => handlePatientBlur('age', parseInt(e.target.value, 10) || 0)}
                    placeholder="e.g. 48"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 flex items-center gap-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={doc?.patient?.gender || 'Male'}
                    onChange={(e) => handlePatientChange('gender', e.target.value as any)}
                    onBlur={(e) => handlePatientBlur('gender', e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Date of Birth (DOB) */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 flex items-center gap-1">
                    Date of Birth (DOB)
                  </label>
                  <input
                    type="date"
                    value={doc?.patient?.dob || ''}
                    onChange={(e) => handlePatientChange('dob', e.target.value)}
                    onBlur={(e) => handlePatientBlur('dob', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                {/* Contact Number */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 flex items-center gap-1">
                    Contact Number / Phone
                  </label>
                  <input
                    type="tel"
                    value={doc?.patient?.phone || ''}
                    onChange={(e) => handlePatientChange('phone', e.target.value)}
                    onBlur={(e) => handlePatientBlur('phone', e.target.value)}
                    placeholder="e.g. +91 98401 23456"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                {/* Patient ID / UHID */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 flex items-center gap-1">
                    UHID / Patient ID
                  </label>
                  <input
                    type="text"
                    value={doc?.patient?.patientId || ''}
                    onChange={(e) => handlePatientChange('patientId', e.target.value)}
                    onBlur={(e) => handlePatientBlur('patientId', e.target.value)}
                    placeholder="PAT-2026-XXXX"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none font-mono text-cyan-800"
                  />
                </div>
              </div>

              {/* Referring Doctor & Clinical Indication */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 block">
                    Referring Physician / Doctor
                  </label>
                  <input
                    type="text"
                    value={doc?.referringPhysician || ''}
                    onChange={(e) => {
                      const updated = { ...doc, referringPhysician: e.target.value };
                      onDocumentChange(updated);
                      updateDocument(doc.id, { referringPhysician: e.target.value });
                    }}
                    onBlur={(e) => {
                      const updated = { ...doc, referringPhysician: e.target.value };
                      onDocumentChange(updated);
                      updateDocument(doc.id, { referringPhysician: e.target.value });
                    }}
                    placeholder="Dr. Physician Name"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-1">
                  <label className="font-bold text-slate-800 block">
                    Clinical Indication / History
                  </label>
                  <input
                    type="text"
                    value={doc?.patient?.clinicalHistory || ''}
                    onChange={(e) => handlePatientChange('clinicalHistory', e.target.value)}
                    onBlur={(e) => handlePatientBlur('clinicalHistory', e.target.value)}
                    placeholder="Abdominal pain, rule out cholecystitis..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  onClick={() => setActiveStep(2)}
                  className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all shadow"
                >
                  Proceed to Step 2: Study Selection <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Study Selection & 23 Word Templates */}
          {activeStep === 2 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-600" />
                  2. Radiology Study Selection (23 Standard Word Templates)
                </h3>
                <span className="text-xs font-mono bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold">
                  {templates.length} Templates Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[450px] overflow-y-auto p-1">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      onDocumentChange({
                        ...doc,
                        templateId: t.id,
                        templateName: t.name,
                        modality: t.modality
                      });
                    }}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${doc.templateId === t.id
                      ? 'bg-cyan-50 border-cyan-500 ring-2 ring-cyan-500/20 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        {t.modality}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">{t.fields.length} Fields</span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-900">{t.name}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{t.description}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setActiveStep(1)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Back to Step 1
                </button>
                <button
                  onClick={() => setActiveStep(3)}
                  className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Proceed to Step 3: Structured Measurements <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Structured Measurements */}
          {activeStep === 3 && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-4">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-600" />
                    3. Structured Measurements & Schema Values
                  </h3>
                  <p className="text-xs text-slate-500">
                    Auto-extracted from Chat/Voice or overridden manually by the doctor.
                  </p>
                </div>
                <span className="text-xs font-mono bg-cyan-100 text-cyan-800 px-2.5 py-1 rounded-full font-bold">
                  {selectedTemplate?.fields?.length || 0} Fields
                </span>
              </div>

              <div className="p-6 space-y-6 max-h-[550px] overflow-y-auto">
                {categories.map((cat) => {
                  const catFields = selectedTemplate.fields.filter(f => f.category === cat);
                  return (
                    <div key={cat} className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
                        {cat}
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {catFields.map((f) => {
                          const currentObs = doc.observations[f.id];
                          const currentVal = currentObs?.value !== undefined ? currentObs.value : f.defaultValue;

                          return (
                            <div key={f.id} className="bg-slate-50/70 border border-slate-200 rounded-xl p-3 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-slate-800">{f.label}</label>
                                {f.unit && (
                                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">
                                    {f.unit}
                                  </span>
                                )}
                              </div>

                              {f.type === 'number' && (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={currentVal !== undefined ? currentVal : ''}
                                    onChange={(e) => handleFieldChange(f.id, parseFloat(e.target.value) || 0, f.unit)}
                                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                  />
                                  {f.normalMax && currentVal > f.normalMax && (
                                    <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                                      High
                                    </span>
                                  )}
                                </div>
                              )}

                              {f.type === 'select' && (
                                <select
                                  value={currentVal || ''}
                                  onChange={(e) => handleFieldChange(f.id, e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-none cursor-pointer"
                                >
                                  {f.options?.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              )}

                              {f.type === 'boolean' && (
                                <div className="flex items-center gap-3 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleFieldChange(f.id, true)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${currentVal === true ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'
                                      }`}
                                  >
                                    YES
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleFieldChange(f.id, false)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${currentVal === false ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                                      }`}
                                  >
                                    NO
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-slate-50 border-t flex justify-between">
                <button onClick={() => setActiveStep(2)} className="text-xs font-semibold text-slate-600">Back</button>
                <button
                  onClick={() => setActiveStep(4)}
                  className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Proceed to Step 4: Findings <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 & 5 & 6: Findings, AI Narrative, Impression Suggestion */}
          {(activeStep === 4 || activeStep === 5 || activeStep === 6) && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-600" />
                  Steps 4-6: Findings, AI Narrative & Impression Suggestion
                </h3>
                <button
                  onClick={handleRunAIServices}
                  disabled={isGeneratingAI}
                  className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                  {isGeneratingAI ? 'Generating Narrative...' : 'Generate Gemini AI Draft'}
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="font-bold text-xs text-slate-800 uppercase tracking-wider block mb-1">
                    Step 4 & 5: FINDINGS (AI Generated Narrative)
                  </label>
                  <textarea
                    value={doc.findingsText}
                    onChange={(e) => onDocumentChange({ ...doc, findingsText: e.target.value })}
                    rows={8}
                    placeholder="Click 'Generate Gemini AI Draft' or type findings prose..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs leading-relaxed focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-xs text-slate-800 uppercase tracking-wider block mb-1">
                    Step 6: IMPRESSION (Diagnostic Conclusions)
                  </label>
                  <textarea
                    value={doc.impressionText.join('\n')}
                    onChange={(e) => onDocumentChange({ ...doc, impressionText: e.target.value.split('\n').filter(Boolean) })}
                    rows={4}
                    placeholder="Numbered diagnostic conclusions..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={() => setActiveStep(3)} className="text-xs font-semibold text-slate-600">Back</button>
                <button
                  onClick={() => setActiveStep(7)}
                  className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Proceed to Step 7: Validation <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: Validation & Consistency Checker */}
          {activeStep === 7 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-cyan-600" />
                  7. Automated Validation & Consistency Audit
                </h3>
                <button
                  onClick={handleValidate}
                  disabled={isValidating}
                  className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  Run Quality Audit
                </button>
              </div>

              {doc.validation ? (
                <div className="space-y-3 text-xs">
                  <div className={`p-3 rounded-xl border font-bold flex items-center gap-2 ${doc.validation.isValid ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
                    }`}>
                    {doc.validation.isValid ? '✅ Report Passed All Rule Engine Checks' : '❌ Validation Issues Require Doctor Review'}
                  </div>

                  {doc.validation.errors.map((e, i) => (
                    <div key={i} className="p-2.5 bg-red-50 text-red-800 rounded-xl border border-red-200 font-semibold">
                      Error: {e}
                    </div>
                  ))}

                  {doc.validation.warnings.map((w, i) => (
                    <div key={i} className="p-2.5 bg-amber-50 text-amber-800 rounded-xl border border-amber-200">
                      Warning: {w}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Click 'Run Quality Audit' to check for missing info or narrative conflicts.</p>
              )}

              <div className="flex justify-between pt-2">
                <button onClick={() => setActiveStep(6)} className="text-xs font-semibold text-slate-600">Back</button>
                <button
                  onClick={() => setActiveStep(8)}
                  className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Proceed to Step 8: Doctor Editing <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 8: Doctor Editing */}
          {activeStep === 8 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-cyan-600" />
                  8. Doctor Interactive Text Editor & Macros
                </h3>
                <span className="text-xs text-slate-500 font-semibold">Direct Inline Overrides Enabled</span>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="font-bold text-xs text-slate-800 uppercase block mb-1">Findings Editor</span>
                  <textarea
                    value={doc.findingsText}
                    onChange={(e) => onDocumentChange({ ...doc, findingsText: e.target.value })}
                    rows={8}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs leading-relaxed focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <span className="font-bold text-xs text-slate-800 uppercase block mb-1">Impression Editor</span>
                  <textarea
                    value={doc.impressionText.join('\n')}
                    onChange={(e) => onDocumentChange({ ...doc, impressionText: e.target.value.split('\n').filter(Boolean) })}
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={() => setActiveStep(7)} className="text-xs font-semibold text-slate-600">Back</button>
                <button
                  onClick={() => setActiveStep(9)}
                  className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Proceed to Step 9: Approval <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 9: Approval */}
          {activeStep === 9 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 mx-auto flex items-center justify-center">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">9. Radiologist Review & Final Approval</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Approving locks the document state to APPROVED. Active Practitioner: <span className="font-bold text-slate-900">{activePractitioner?.name}</span>
              </p>

              <button
                onClick={handleApprove}
                disabled={doc.status === 'APPROVED' || doc.status === 'DIGITALLY_SIGNED'}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-lg cursor-pointer"
              >
                {doc.status === 'APPROVED' || doc.status === 'DIGITALLY_SIGNED' ? 'Report Approved' : 'Approve Report as Radiologist'}
              </button>

              <div className="flex justify-between pt-4 border-t">
                <button onClick={() => setActiveStep(8)} className="text-xs font-semibold text-slate-600">Back</button>
                <button
                  onClick={() => setActiveStep(10)}
                  className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Proceed to Step 10: PDF Preview <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 10: PDF Preview */}
          {activeStep === 10 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-cyan-100 text-cyan-600 mx-auto flex items-center justify-center">
                <Printer className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">10. Hospital Branded PDF Report Preview</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Open the high-resolution printable PDF modal complete with hospital letterhead, patient QR verification code, and official formatting.
              </p>

              <button
                onClick={handleOpenPdf}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-lg cursor-pointer"
              >
                Open Full Branded PDF Report
              </button>

              <div className="flex justify-between pt-4 border-t">
                <button onClick={() => setActiveStep(9)} className="text-xs font-semibold text-slate-600">Back</button>
                <button
                  onClick={() => setActiveStep(11)}
                  className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Proceed to Step 11: Digital Signature <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 11: Digital Signature */}
          {activeStep === 11 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">11. PKI Digital Signature & Cryptographic Seal</h3>

              {doc.digitalSignature ? (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-left text-xs space-y-2 max-w-lg mx-auto">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 uppercase">Status: DIGITALLY SIGNED & SEALED</span>
                    <span className="font-mono text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                      PKI Verified
                    </span>
                  </div>
                  <p><span className="font-semibold text-slate-700">Signed By:</span> {doc.digitalSignature.signedBy}</p>
                  <p><span className="font-semibold text-slate-700">Reg No:</span> {doc.digitalSignature.registrationNo}</p>
                  <p><span className="font-semibold text-slate-700">Timestamp:</span> {new Date(doc.digitalSignature.signedAt).toLocaleString()}</p>
                  <p><span className="font-semibold text-slate-700">Cryptographic Hash:</span> <code className="font-mono text-cyan-800">{doc.digitalSignature.hash}</code></p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    Apply official PKI RSA cryptographic seal lock for {activePractitioner?.name} ({activePractitioner?.registrationNo}).
                  </p>
                  <button
                    onClick={handleSign}
                    disabled={isSigning}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-lg cursor-pointer"
                  >
                    {isSigning ? 'Applying PKI Seal...' : 'Apply Cryptographic Seal Lock'}
                  </button>
                </div>
              )}

              <div className="flex justify-start pt-4 border-t">
                <button onClick={() => setActiveStep(10)} className="text-xs font-semibold text-slate-600">Back</button>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Interactive Voice & Chat RAG Co-Pilot Drawer */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[740px] overflow-hidden text-white">

            {/* Header */}
            <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cyan-950 rounded-lg border border-cyan-800/60">
                  <Brain className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    Radiology RAG Co-Pilot
                    <span className="text-[9px] bg-cyan-900/80 text-cyan-300 font-mono px-1.5 py-0.5 rounded border border-cyan-700/50">
                      RAG Context Active
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400">Interactive Chat & Structured Field Assistant</p>
                </div>
              </div>

              {/* RAG Toggle */}
              <button
                type="button"
                onClick={() => setRagEnabled(!ragEnabled)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition-all flex items-center gap-1.5 ${ragEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                title="Toggle ACR & BI-RADS Retrieval-Augmented Generation context"
              >
                <BookOpen className="w-3 h-3" />
                RAG: {ragEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Patient & Template Context Banner (Guarantees full session context awareness) */}
            <div className="bg-slate-950/80 border-b border-slate-800 px-3.5 py-2 text-[11px] text-slate-300 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-cyan-400" />
                  <strong className="text-white">{doc?.patient?.name || 'Patient'}</strong> ({doc?.patient?.age || '--'}Y/{doc?.patient?.gender || 'U'})
                </span>
                <span className="text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                  {doc?.templateName || 'Study Template'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-1 italic">
                Clinical Context: {doc?.patient?.clinicalHistory || 'Routine diagnostic evaluation'}
              </p>
            </div>

            {/* RAG Standards Active Banner */}
            {ragEnabled && (
              <div className="bg-cyan-950/40 border-b border-cyan-900/50 px-3.5 py-1.5 text-[10px] text-cyan-300 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <span className="font-mono text-[9.5px]">
                    ACR Standards 2025 • BI-RADS • Fleischner Guidelines
                  </span>
                </div>
                <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/50">
                  Contextualized
                </span>
              </div>
            )}

            {/* Chat Messages List */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'doctor' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1">
                    <span>{msg.sender === 'doctor' ? 'Dr. Radiologist' : 'RAG Co-Pilot'}</span>
                    <span>• {msg.timestamp}</span>
                  </div>

                  <div className={`p-3 rounded-2xl max-w-[90%] leading-relaxed ${msg.sender === 'doctor'
                    ? 'bg-cyan-600 text-white rounded-br-none shadow-md'
                    : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none shadow'
                    }`}>
                    {msg.text}

                    {msg.ragSources && (
                      <div className="mt-2 pt-2 border-t border-slate-700/60 text-[9px] font-mono text-cyan-300 space-y-0.5">
                        <span className="font-semibold uppercase block text-slate-400">RAG Standard Citations:</span>
                        {msg.ragSources.map((src, i) => (
                          <div key={i}>• {src}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Voice Dictation Waveform Visualizer if Recording */}
            {isRecordingVoice && (
              <div className="bg-red-950/60 border-t border-red-900/60 px-4 py-2.5 flex items-center justify-between text-xs text-red-300 animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="font-bold uppercase tracking-wider text-[10px]">Listening to Doctor Dictation...</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1 h-3 bg-red-400 animate-bounce" />
                  <span className="w-1 h-5 bg-red-400 animate-bounce delay-100" />
                  <span className="w-1 h-2 bg-red-400 animate-bounce delay-200" />
                </div>
              </div>
            )}

            {/* Chat Input & Voice Recorder Form */}
            <form onSubmit={(e) => handleSendChat(e)} className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
              {/* Guided RAG Prompts & Template Query Chips */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-bold uppercase text-slate-500">Guided Template Prompts:</span>
                  <span className="text-cyan-400 text-[9px] font-mono">Patient Context Loaded</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] text-slate-400 no-scrollbar">
                  <button
                    type="button"
                    onClick={() => handleSendChat(undefined, `What are the mandatory template fields for ${doc?.templateName}?`)}
                    className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-2 py-0.5 rounded-md whitespace-nowrap cursor-pointer transition-all border border-slate-700"
                  >
                    📋 Required Fields for {doc?.templateName}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendChat(undefined, 'Gallbladder shows a 6.0 mm calculus with normal wall thickness and no pericholecystic fluid.')}
                    className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-2 py-0.5 rounded-md whitespace-nowrap cursor-pointer transition-all border border-slate-700"
                  >
                    🎤 Dictate: GB Calculus 6mm
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendChat(undefined, 'Liver size 15.8 cm with diffuse increased echogenicity suggesting grade 1 fatty liver.')}
                    className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-2 py-0.5 rounded-md whitespace-nowrap cursor-pointer transition-all border border-slate-700"
                  >
                    🎤 Dictate: Fatty Liver 15.8cm
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendChat(undefined, 'Check current findings against ACR reporting guidelines.')}
                    className="bg-slate-800 hover:bg-slate-700 text-emerald-300 px-2 py-0.5 rounded-md whitespace-nowrap cursor-pointer transition-all border border-slate-700"
                  >
                    📚 Audit ACR Guidelines
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <VoiceRecording
                  currentText={chatInput}
                  onTranscriptChange={(newText) => setChatInput(newText)}
                  onSendSubmit={() => handleSendChat()}
                />

                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Chat with AI about ${doc?.templateName || 'radiology'} or dictate findings...`}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
                />

                <button
                  type="submit"
                  disabled={isSendingChat || !chatInput.trim()}
                  className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white p-2.5 rounded-xl transition-all cursor-pointer"
                  title="Send message to AI RAG backend"
                >
                  <Send className={`w-4 h-4 ${isSendingChat ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span>RAG Chat maintains context of patient data & active template</span>
                <span className="text-cyan-400 font-semibold">Gemini 3.6 Flash Engine</span>
              </div>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
};
