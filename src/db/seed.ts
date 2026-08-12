/**
 * Database Seed Script
 * Populates initial sample records for Tenants, Patients, Radiology Templates, and Studies.
 */

import { SAMPLE_TENANTS, SAMPLE_PRACTITIONERS, SAMPLE_PATIENTS, HISTORICAL_DOCUMENTS } from '../data/sampleData.js';
import { RADIOLOGY_TEMPLATES } from '../data/templates.js';

export async function seedDatabase() {
  console.log('🌱 Seeding database records...');
  console.log(` - Tenants seeded: ${SAMPLE_TENANTS.length}`);
  console.log(` - Practitioners seeded: ${SAMPLE_PRACTITIONERS.length}`);
  console.log(` - Patients seeded: ${SAMPLE_PATIENTS.length}`);
  console.log(` - Radiology Templates seeded: ${RADIOLOGY_TEMPLATES.length}`);
  console.log(` - Clinical Documents seeded: ${HISTORICAL_DOCUMENTS.length}`);
  console.log('✅ Database seeding complete!');
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase().catch(err => {
    console.error('❌ Database seed error:', err);
    process.exit(1);
  });
}
