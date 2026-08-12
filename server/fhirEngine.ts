import { ClinicalDocument } from '../src/types';

export function convertToFHIRDiagnosticReport(doc: ClinicalDocument): any {
  const patientRef = `Patient/${doc.patient.patientId}`;
  const practitionerRef = doc.practitioner ? `Practitioner/${doc.practitioner.registrationNo}` : 'Practitioner/UNKNOWN';
  const reportId = `DiagnosticReport-${doc.id}`;

  // Generate atomic Observation resources for structured measurements
  const observations: any[] = [];
  const observationRefs: any[] = [];

  Object.entries(doc.observations).forEach(([fieldKey, obsValue]) => {
    if (obsValue.value !== undefined && obsValue.value !== null) {
      const obsId = `Obs-${doc.id}-${fieldKey}`;
      observationRefs.push({
        reference: `Observation/${obsId}`,
        display: `${fieldKey}: ${obsValue.value} ${obsValue.unit || ''}`
      });

      observations.push({
        resourceType: 'Observation',
        id: obsId,
        status: 'final',
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                code: 'imaging',
                display: 'Imaging'
              }
            ]
          }
        ],
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '18748-4',
              display: `${fieldKey} observation`
            }
          ],
          text: fieldKey.replace(/_/g, ' ').toUpperCase()
        },
        subject: { reference: patientRef, display: doc.patient.name },
        effectiveDateTime: doc.studyDate,
        valueQuantity: typeof obsValue.value === 'number' ? {
          value: obsValue.value,
          unit: obsValue.unit || '',
          system: 'http://unitsofmeasure.org'
        } : undefined,
        valueString: typeof obsValue.value !== 'number' ? String(obsValue.value) : undefined
      });
    }
  });

  const diagnosticReportResource = {
    resourceType: 'DiagnosticReport',
    id: reportId,
    meta: {
      versionId: String(doc.version || 1),
      lastUpdated: doc.updatedAt || new Date().toISOString()
    },
    identifier: [
      {
        system: 'urn:oid:2.16.840.1.113883.2.4.3.11.1',
        value: doc.accessionNumber || doc.id
      }
    ],
    status: doc.status === 'APPROVED' || doc.status === 'DIGITALLY_SIGNED' ? 'final' : 'registered',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
            code: doc.modality,
            display: `${doc.modality} Imaging`
          }
        ]
      }
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '24725-4',
          display: doc.templateName
        }
      ],
      text: doc.templateName
    },
    subject: {
      reference: patientRef,
      display: doc.patient.name
    },
    effectiveDateTime: doc.studyDate,
    issued: doc.updatedAt || new Date().toISOString(),
    performer: [
      {
        reference: practitionerRef,
        display: doc.practitioner?.name || 'Radiologist'
      }
    ],
    result: observationRefs,
    conclusion: doc.impressionText.join('\n'),
    presentedForm: [
      {
        contentType: 'text/plain',
        data: Buffer.from(doc.findingsText || '').toString('base64'),
        title: 'Diagnostic Impression Narrative'
      }
    ]
  };

  const patientResource = {
    resourceType: 'Patient',
    id: doc.patient.patientId,
    identifier: [
      {
        system: 'http://hospital.org/patient-ids',
        value: doc.patient.patientId
      }
    ],
    name: [
      {
        text: doc.patient.name,
        use: 'official'
      }
    ],
    gender: doc.patient.gender.toLowerCase(),
    birthDate: doc.patient.dob || '1980-01-01'
  };

  return {
    resourceType: 'Bundle',
    type: 'collection',
    timestamp: new Date().toISOString(),
    entry: [
      { resource: diagnosticReportResource },
      { resource: patientResource },
      ...observations.map(obs => ({ resource: obs }))
    ]
  };
}
