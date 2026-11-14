import { ClinicalDocument, FieldDefinition, ObservationData } from '../types';
import { RADIOLOGY_TEMPLATES } from '../data/templates';

export interface FormattedObservation {
  label: string;
  value: string;
}

export interface FormattedObservationGroup {
  category: string;
  observations: FormattedObservation[];
}

const humanizeFieldId = (fieldId: string) => fieldId
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/\b\w/g, character => character.toUpperCase());

export function formatObservationGroups(
  observations: ObservationData,
  templateId?: string,
  templateName?: string,
): FormattedObservationGroup[] {
  const template = RADIOLOGY_TEMPLATES.find(item => item.id === templateId) ||
    RADIOLOGY_TEMPLATES.find(item => item.name === templateName);
  const fields = new Map<string, FieldDefinition>((template?.fields || []).map(field => [field.id, field]));
  const groups = new Map<string, FormattedObservation[]>();

  Object.entries(observations || {}).forEach(([fieldId, data]) => {
    const observation = data as unknown as { value?: unknown; unit?: string } | null;
    const value = observation && typeof observation === 'object' && 'value' in observation
      ? observation.value
      : data;
    if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) return;

    const field = fields.get(fieldId);
    const formattedValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value).trim();
    const unit = observation && typeof observation === 'object' && observation.unit
      ? observation.unit
      : field?.unit;
    const category = field?.category?.trim() || 'Observations';
    const group = groups.get(category) || [];
    group.push({
      label: field?.label?.trim() || humanizeFieldId(fieldId),
      value: [formattedValue, unit].filter(Boolean).join(' '),
    });
    groups.set(category, group);
  });

  return Array.from(groups, ([category, observations]) => ({ category, observations }));
}

export function getFormattedObservationGroups(document: ClinicalDocument): FormattedObservationGroup[] {
  return formatObservationGroups(document.observations, document.templateId, document.templateName);
}

export function getDisplayFindings(document: ClinicalDocument): string {
  const findings = document.findingsText?.trim() || '';
  if (findings && !/^FINDINGS DRAFT \(Deterministic Fallback\):|Structured findings:/i.test(findings)) return findings;
  const groups = getFormattedObservationGroups(document);
  return groups.map(group => `${group.category}: ${group.observations.map(item => `${item.label}: ${item.value}`).join('; ')}.`).join('\n\n') ||
    'No structured observations were recorded for this examination.';
}
