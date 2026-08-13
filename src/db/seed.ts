/**
 * Database Seed Script
 * Populates initial records into PostgreSQL for Tenants, Practitioners, Patients, Templates, Clinical Documents, and Audit Logs.
 */

import { SAMPLE_TENANTS, SAMPLE_PRACTITIONERS, SAMPLE_PATIENTS, HISTORICAL_DOCUMENTS } from '../data/sampleData';
import { RADIOLOGY_TEMPLATES } from '../data/templates';
import {
  saveTenantToDb,
  createPractitionerInDb,
  createPatientInDb,
  saveTemplateToDb,
  saveDocumentToDb,
  createAuditLogInDb,
  getTenantsFromDb,
  getPractitionersFromDb,
  getPatientsFromDb,
  getTemplatesFromDb,
  getDocumentsFromDb
} from './dbClient';

export async function seedDatabase() {
  console.log('----------------------------------------------------');
  console.log('🌱 Chakkra Clinical Intelligence - Database Seeder');
  console.log('----------------------------------------------------');

  try {
    // 1. Seed Tenants
    const existingTenants = await getTenantsFromDb();
    if (existingTenants.length === 0) {
      console.log(`📌 Seeding ${SAMPLE_TENANTS.length} Hospital Tenants into PostgreSQL...`);
      for (const tenant of SAMPLE_TENANTS) {
        await saveTenantToDb(tenant);
      }
      console.log('✅ Hospital Tenants seeded.');
    } else {
      console.log(`ℹ️ Hospital Tenants already exist in PostgreSQL (${existingTenants.length} found).`);
    }

    // 2. Seed Practitioners (Doctors)
    const existingPractitioners = await getPractitionersFromDb();
    if (existingPractitioners.length === 0) {
      console.log(`📌 Seeding ${SAMPLE_PRACTITIONERS.length} Practitioners into PostgreSQL...`);
      for (const practitioner of SAMPLE_PRACTITIONERS) {
        await createPractitionerInDb(practitioner);
      }
      console.log('✅ Practitioners (Doctors) seeded.');
    } else {
      console.log(`ℹ️ Practitioners already exist in PostgreSQL (${existingPractitioners.length} found).`);
    }

    // 3. Seed Patients
    const existingPatients = await getPatientsFromDb();
    if (existingPatients.length === 0) {
      console.log(`📌 Seeding ${SAMPLE_PATIENTS.length} Patients into PostgreSQL...`);
      for (const patient of SAMPLE_PATIENTS) {
        await createPatientInDb(patient);
      }
      console.log('✅ Patients seeded.');
    } else {
      console.log(`ℹ️ Patients already exist in PostgreSQL (${existingPatients.length} found).`);
    }

    // 4. Seed Templates
    const existingTemplates = await getTemplatesFromDb();
    if (existingTemplates.length <= 1) {
      console.log(`📌 Seeding ${RADIOLOGY_TEMPLATES.length} Radiology Templates into PostgreSQL...`);
      for (const tmpl of RADIOLOGY_TEMPLATES) {
        await saveTemplateToDb(tmpl);
      }
      console.log('✅ Radiology Templates seeded.');
    } else {
      console.log(`ℹ️ Templates already exist in PostgreSQL (${existingTemplates.length} found).`);
    }

    // 5. Seed Clinical Documents
    const existingDocs = await getDocumentsFromDb();
    if (existingDocs.length === 0) {
      console.log(`📌 Seeding ${HISTORICAL_DOCUMENTS.length} Clinical Documents into PostgreSQL...`);
      for (const doc of HISTORICAL_DOCUMENTS) {
        await saveDocumentToDb(doc);
      }
      console.log('✅ Clinical Documents seeded.');
    } else {
      console.log(`ℹ️ Clinical Documents already exist in PostgreSQL (${existingDocs.length} found).`);
    }

    // 6. Seed Initial Audit Log
    await createAuditLogInDb({
      actor: 'System Database Seeder',
      action: 'SYSTEM_BOOTSTRAPPED',
      details: 'PostgreSQL database seeded with default tenant, doctor, patient, and study schemas.'
    });

    console.log('----------------------------------------------------');
    console.log('🎉 Database seeding completed successfully!');
    console.log('----------------------------------------------------');
  } catch (err: any) {
    console.error('❌ Database seeding failed:', err.message);
    throw err;
  }
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase().catch(err => {
    console.error('❌ Database seed error:', err);
    process.exit(1);
  });
}
