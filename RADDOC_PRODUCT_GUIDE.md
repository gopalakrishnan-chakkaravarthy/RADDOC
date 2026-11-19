# Chakkra RADDOC — Product Guide

**AI-assisted radiology documentation for radiologists, hospitals and diagnostic centres**

Chakkra RADDOC is a browser-based clinical reporting workspace for creating, reviewing, approving and managing diagnostic reports. It combines structured report templates, AI-assisted drafting, voice dictation, report comparison, facility branding and export tools in one workflow.

> **Clinical responsibility:** AI output is a draft for clinician review. A qualified practitioner must verify the patient and study details, findings, impression and final report before approval or signature. RADDOC supports documentation; it does not replace clinical judgement or image interpretation.

## At a glance

- Organise studies and reports in a searchable clinical queue.
- Draft structured reports using modality templates, typed findings or speech dictation.
- Use AI assistance to generate or refine report text and identify potential inconsistencies or missing information.
- Review previous studies and compare structured observations over time.
- Validate, approve, digitally sign, print or save a facility-branded report.
- Manage hospital branding, practitioners, templates, invoices and subscription usage, according to account permissions.

## Modules

### Clinical Queue

Search and review diagnostic studies using patient, accession or study information. Create a study by selecting a patient, modality and report template; open an existing study in Report Studio; and track its workflow status. Patient demographics and clinical history support report identification and context.

### Report Studio

The primary reporting workspace. It brings together patient and study details, structured template observations, findings and impression text, AI assistance, validation, review and approval, PDF preview and digital signature. Clinicians can edit the generated draft before finalising it. The available fields depend on the selected template.

### Voice dictation

Use the browser's speech recognition capability to dictate report text where supported by the browser and device. Review and correct the transcript before using it in a clinical report. Microphone access and browser speech-service availability are required.

### Previous Study Compare

Link a current study with a prior report and view changes in structured observations, including increases, decreases, unchanged values, new findings or resolved findings where the data permits. This supports longitudinal review; the clinician determines clinical significance.

### Reporting and invoices

View the facility's invoice records, search by patient or diagnostic type, create an invoice for a report, update invoice amount and status, and print an invoice. Invoice status options include Draft, Issued, Paid and Cancelled. This is an operational billing aid, not a payment processing service.

### Hospital and doctor management

Authorised administrators can maintain facility profile and report letterhead details, including facility name, address, contact information, department, logo and accreditation text. Practitioner records can include name, qualification, registration number, designation and signature image.

### Template management

Authorised administrators can create and maintain structured report templates, including modality, category, description and field definitions. Template fields can be configured for text, numeric, selection or boolean responses, with optional units, ranges, defaults and required-field settings. Templates should be clinically reviewed before use.

### PDF report output

Preview and print or save a report as a hospital-branded PDF. Confirm the content and facility details before distribution. The available fields and signature presentation depend on report data and configuration.

### FHIR and DICOM SR

Inspect interoperability representations associated with a report. The application presents FHIR R4 DiagnosticReport-oriented data and a DICOM Structured Reporting export/view. Confirm receiving-system compatibility and mapping requirements as part of deployment; availability in the application does not by itself establish integration with a PACS, RIS, HIS or EHR.

### Audit trail

Review recorded document events and revisions for governance and traceability. Access and visible event details depend on the signed-in role and configured data source.

### User and hospital mapping *(system administrator)*

Assign registered user accounts to a hospital. The application is designed to scope users to their assigned hospital and its records.

### Subscription management *(system administrator)*

Configure annual plan prices and limits, activate or deactivate plans, and assign a plan to a hospital. The interface shows report usage and user counts. Assigning or renewing a plan starts/resets its annual reporting allowance and period; user-limit checks apply when users or plans are assigned.

### Subscription report *(system administrator)*

Filter reports by hospital, subscription plan and date range, then inspect matching report and usage records. This module is intended for platform administration, not routine hospital reporting.

### Developer API Explorer *(system administrator)*

Explore the application's available REST endpoints and report-related API operations. API use requires appropriate technical access and deployment configuration.

### Account access

Users sign in with an account, can change their password and sign out. Access to system administration modules is restricted to the system administrator role. Hospital users work within the hospital assigned to their account.

## Typical reporting workflow

1. Sign in to the hospital workspace and open **Clinical Queue**.
2. Search for a patient or create/select the patient record, then create a study with the appropriate modality and template.
3. In **Report Studio**, confirm patient identity, accession and clinical context. Complete the structured observations and draft the findings and impression, using dictation or AI assistance if desired.
4. Review all fields and AI suggestions. Run validation and address relevant errors or warnings.
5. A qualified radiologist reviews and approves the report, then applies the available digital signature when appropriate.
6. Preview the branded report and print/save the PDF or use the available interoperability representation.
7. Use **Previous Study Compare** when an appropriate prior report is available. Record operational billing details in **Reporting** if required.

## Subscription plans

The following are the **seeded default values in the application database**. They are annual prices in USD and can be changed by a system administrator. Confirm current commercial terms, taxes, currency, renewal and support arrangements with the provider before purchase.

| Plan | Default annual price | Users | Reports per annual period |
|---|---:|---:|---:|
| Basic | $72 | 1 | 3,000 |
| Corporate | $600 | 10 | 3,500 |
| Unlimited | $3,600 | Unlimited | Unlimited |

An unlimited value means the corresponding limit is unset in the plan configuration. Plan assignment creates or renews an annual subscription period. The report allowance resets on plan assignment or renewal. A hospital needs an active assigned plan to use subscription-controlled functions; usage and status are displayed in the application. Plan availability and values may change through administrative configuration.

## Roles and access

| Audience / role | Typical access |
|---|---|
| Radiologist / clinical user | Clinical Queue, Report Studio, study comparison and facility reporting workflow |
| Hospital administrator | Hospital and practitioner setup, and operational modules permitted to the account |
| System administrator | User-hospital mapping, subscription and template administration, subscription reporting, API explorer and other platform administration tools |

Exact navigation depends on account role and deployment configuration. A system administrator account is required to access platform-level modules.

## Information and deployment notes

- The application supports ultrasound (USG), X-ray, CT, MRI, mammography and echo modalities, with available templates determined by the configured template library.
- AI features are assistive. Review outputs for accuracy, completeness and suitability before clinical use.
- The application includes database-backed and sample-data modes. Demonstrations using sample data are not live patient records; confirm the active data source before operational use.
- FHIR/DICOM representations and an API explorer are provided, but a live connection to external clinical systems requires separate integration and validation.
- Speech dictation depends on browser/device support and permissions.
- Configure facility identity, practitioners, templates, users, subscription and database before production workflows. Follow your organisation's policies for patient information, account security, retention and sharing.

## Support and onboarding checklist

Before go-live, the facility should confirm its account and assigned hospital, configure branding and practitioner details, review templates, select and confirm a subscription, verify data-source configuration, and validate its reporting and export workflow with representative non-production records.
