import express from 'express';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHmac } from 'crypto';
import { promisify } from 'util';
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
import { getDbPool } from './src/db/dbClient';

const app = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = 'raddoc_session';
const sessionSecret = process.env.AUTH_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'local-development-only-change-me');
const sessionDurationSeconds = 60 * 60 * 24 * 7;
function signSession(payload: string) {
  if (!sessionSecret) throw new Error('AUTH_SECRET must be configured in production');
  return createHmac('sha256', sessionSecret).update(payload).digest('base64url');
}
function readSession(req: express.Request): { id: string; version: number } | null {
  const cookies = req.headers.cookie || '';
  const token = cookies.split(';').map(part => part.trim()).find(part => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
  if (!token) return null;
  const [payload, signature] = decodeURIComponent(token).split('.');
  if (!payload || !signature) return null;
  const expected = signSession(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.exp > Date.now() ? data.user : null;
  } catch { return null; }
}
function setSessionCookie(res: express.Response, user: { id: string; name: string; email: string; sessionVersion: number }) {
  const payload = Buffer.from(JSON.stringify({ user: { id: user.id, version: user.sessionVersion }, exp: Date.now() + sessionDurationSeconds * 1000 })).toString('base64url');
  const token = `${payload}.${signSession(payload)}`;
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionDurationSeconds}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
}

async function ensureSystemAdminAccount() {
  const email = (process.env.SYSTEM_ADMIN_EMAIL || 'sysadmin@raddoc.local').trim().toLowerCase();
  const existing = await getDbPool().query('SELECT id FROM app_users WHERE email = $1', [email]);
  if (existing.rows[0]) {
    await getDbPool().query("UPDATE app_users SET role = 'system_admin', tenant_id = NULL WHERE id = $1", [existing.rows[0].id]);
    return;
  }
  const password = process.env.SYSTEM_ADMIN_PASSWORD || randomBytes(24).toString('base64url');
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64) as Buffer;
  await getDbPool().query("INSERT INTO app_users (id, name, email, password_hash, role, tenant_id) VALUES ($1, 'System Administrator', $2, $3, 'system_admin', NULL)", [
    `sys-${randomBytes(16).toString('hex')}`, email, `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
  ]);
  if (!process.env.SYSTEM_ADMIN_PASSWORD) {
    console.warn(`Initial system admin account created. Login email: ${email}; one-time password: ${password}`);
  } else {
    console.log(`System admin account ready for ${email}.`);
  }
}
function clearSessionCookie(res: express.Response) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
}

app.post('/api/v1/auth/signup', async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (name.length < 2 || name.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10 || password.length > 128) {
    return res.status(400).json({ error: 'Enter a valid name and email, and a password between 10 and 128 characters.' });
  }
  try {
    const salt = randomBytes(16);
    const derived = await scrypt(password, salt, 64) as Buffer;
    const id = `usr-${randomBytes(16).toString('hex')}`;
    const result = await getDbPool().query(`INSERT INTO app_users (id, name, email, password_hash, tenant_id, role)
      SELECT $1, $2, $3, $4, (SELECT id FROM tenants ORDER BY created_at ASC LIMIT 1),
        CASE WHEN NOT EXISTS (SELECT 1 FROM app_users) THEN 'admin' ELSE 'user' END
      WHERE EXISTS (SELECT 1 FROM tenants)
      RETURNING id, name, email, tenant_id, role, session_version`, [id, name, email, `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`]);
    if (!result.rows[0]) return res.status(503).json({ error: 'No hospital is configured yet. Please contact the system administrator.' });
    const row = result.rows[0];
    const user = { id: row.id, name: row.name, email: row.email, tenantId: row.tenant_id, role: row.role };
    setSessionCookie(res, { ...user, sessionVersion: row.session_version });
    res.status(201).json({ user });
  } catch (err: any) {
    if (err.code === '23505') return res.status(409).json({ error: 'An account with this email already exists.' });
    console.error('Signup failed:', err.message);
    res.status(503).json({ error: 'Signup is unavailable. Check the database connection and try again.' });
  }
});

app.post('/api/v1/auth/login', async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  try {
    const result = await getDbPool().query('SELECT id, name, email, tenant_id, role, session_version, password_hash FROM app_users WHERE email = $1', [email]);
    const row = result.rows[0];
    let valid = false;
    if (row && password.length <= 128) {
      const [, saltHex, hashHex] = row.password_hash.split('$');
      const hash = await scrypt(password, Buffer.from(saltHex, 'hex'), 64) as Buffer;
      const storedHash = Buffer.from(hashHex, 'hex');
      valid = hash.length === storedHash.length && timingSafeEqual(hash, storedHash);
    }
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });
    if (!row.tenant_id && row.role !== 'system_admin') return res.status(403).json({ error: 'Your account is not assigned to a hospital.' });
    const user = { id: row.id, name: row.name, email: row.email, tenantId: row.tenant_id, role: row.role };
    setSessionCookie(res, { ...user, sessionVersion: row.session_version });
    res.json({ user });
  } catch (err: any) {
    console.error('Login failed:', err.message);
    res.status(503).json({ error: 'Login is unavailable. Check the database connection and try again.' });
  }
});

app.get('/api/v1/auth/me', async (req, res) => {
  const session = readSession(req);
  if (!session) return res.status(401).json({ error: 'Authentication required.' });
  try {
    const result = await getDbPool().query('SELECT id, name, email, tenant_id, role, session_version FROM app_users WHERE id = $1', [session.id]);
    if (!result.rows[0]) return res.status(401).json({ error: 'Authentication required.' });
    const row = result.rows[0];
    if (Number(row.session_version) !== session.version) return res.status(401).json({ error: 'Session ended because your hospital access changed. Sign in again.' });
    if (!row.tenant_id && row.role !== 'system_admin') return res.status(403).json({ error: 'Your account is not assigned to a hospital.' });
    res.json({ user: { id: row.id, name: row.name, email: row.email, tenantId: row.tenant_id, role: row.role } });
  } catch { res.status(503).json({ error: 'Could not verify the current session.' }); }
});

app.post('/api/v1/auth/logout', (_req, res) => {
  clearSessionCookie(res);
  res.json({ success: true });
});

app.post('/api/v1/auth/change-password', async (req, res) => {
  const session = readSession(req);
  const currentPassword = typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
  const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
  if (!session) return res.status(401).json({ error: 'Sign in again to change your password.' });
  if (newPassword.length < 10 || newPassword.length > 128) return res.status(400).json({ error: 'New password must be between 10 and 128 characters.' });
  try {
    const result = await getDbPool().query('SELECT id, name, email, tenant_id, role, session_version, password_hash FROM app_users WHERE id = $1', [session.id]);
    const row = result.rows[0];
    if (!row || Number(row.session_version) !== session.version) return res.status(401).json({ error: 'Your session has expired. Sign in again.' });
    const [, saltHex, hashHex] = row.password_hash.split('$');
    const currentHash = await scrypt(currentPassword, Buffer.from(saltHex, 'hex'), 64) as Buffer;
    const storedHash = Buffer.from(hashHex, 'hex');
    if (currentHash.length !== storedHash.length || !timingSafeEqual(currentHash, storedHash)) return res.status(400).json({ error: 'Current password is incorrect.' });
    const salt = randomBytes(16);
    const newHash = await scrypt(newPassword, salt, 64) as Buffer;
    const updated = await getDbPool().query('UPDATE app_users SET password_hash = $1, session_version = session_version + 1 WHERE id = $2 RETURNING session_version', [`scrypt$${salt.toString('hex')}$${newHash.toString('hex')}`, session.id]);
    setSessionCookie(res, { id: row.id, name: row.name, email: row.email, sessionVersion: updated.rows[0].session_version });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Password change failed:', err.message);
    res.status(503).json({ error: 'Could not change password right now.' });
  }
});

app.use('/api/v1', async (req, res, next) => {
  if (req.path === '/health' || req.path.startsWith('/auth/')) return next();
  const session = readSession(req);
  if (!session) return res.status(401).json({ error: 'Authentication required.' });
  try {
    const result = await getDbPool().query('SELECT id, name, email, tenant_id, role, session_version FROM app_users WHERE id = $1', [session.id]);
    if (!result.rows[0]) return res.status(401).json({ error: 'Authentication required.' });
    if (Number(result.rows[0].session_version) !== session.version) return res.status(401).json({ error: 'Session ended because your hospital access changed. Sign in again.' });
    (req as any).authUser = { id: result.rows[0].id, name: result.rows[0].name, email: result.rows[0].email, tenantId: result.rows[0].tenant_id, role: result.rows[0].role };
    if (result.rows[0].role === 'system_admin') {
      const isManagementRoute = req.path.startsWith('/system-admin') || req.path.startsWith('/tenants') || req.path.startsWith('/practitioners');
      const isReadOnlyClinicalRoute = req.method === 'GET' && ['/documents', '/templates', '/audit-logs'].some(prefix => req.path === prefix || req.path.startsWith(`${prefix}/`));
      if (!isManagementRoute && !isReadOnlyClinicalRoute) {
        return res.status(403).json({ error: 'This system admin account does not have access to that API.' });
      }
    }
    if (!(req as any).authUser.tenantId && result.rows[0].role !== 'system_admin') {
      return res.status(403).json({ error: 'Your account is not assigned to a hospital.' });
    }
    next();
  } catch { res.status(503).json({ error: 'Could not verify the current session.' }); }
});

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

async function createInvoiceForGeneratedReport(doc: ClinicalDocument) {
  const configuredAmount = Number(process.env.REPORT_DEFAULT_FEE || 0);
  const amount = Number.isFinite(configuredAmount) && configuredAmount > 0 ? configuredAmount : 0;
  const currency = (process.env.REPORT_CURRENCY || 'INR').toUpperCase().slice(0, 3);
  const invoiceNumber = `INV-${new Date().getFullYear()}-${randomBytes(5).toString('hex').toUpperCase()}`;
  await getDbPool().query(`INSERT INTO invoices (
    id, invoice_number, document_id, tenant_id, patient_id, patient_name,
    mobile_number, diagnostic_type, amount, currency, status
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  ON CONFLICT (document_id) DO NOTHING`, [
    `inv-${randomBytes(12).toString('hex')}`, invoiceNumber, doc.id, doc.tenantId,
    doc.patient?.id || null, doc.patient?.name || 'Patient', doc.patient?.phone || null,
    doc.templateName || doc.modality, amount, currency, amount > 0 ? 'ISSUED' : 'DRAFT'
  ]);
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
  if (!isAdmin(req, res)) return;
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
  const tenantId = currentUser(req).tenantId;
  const docs = useDatabaseDataMode
    ? await getDocumentsFromDb(tenantId || undefined)
    : HISTORICAL_DOCUMENTS.filter(doc => !tenantId || doc.tenantId === tenantId);

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

function currentUser(req: express.Request) { return (req as any).authUser as { id: string; name: string; email: string; tenantId: string | null; role: 'system_admin' | 'admin' | 'user' }; }
function isSystemAdmin(req: express.Request, res: express.Response) {
  if (currentUser(req).role === 'system_admin') return true;
  res.status(403).json({ error: 'System administrator access required.' });
  return false;
}
function isAdmin(req: express.Request, res: express.Response) {
  if (currentUser(req).role === 'admin') return true;
  res.status(403).json({ error: 'Administrator access required.' });
  return false;
}

app.get('/api/v1/tenants', async (req, res) => {
  try {
    const user = currentUser(req);
    const allTenants = useDatabaseDataMode ? await getTenantsFromDb() : SAMPLE_TENANTS;
    const tenants = user.role === 'system_admin' ? allTenants : allTenants.filter(tenant => tenant.id === user.tenantId);
    res.json({ tenants });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch tenants', message: err.message });
  }
});

app.post('/api/v1/tenants', async (req, res) => {
  try {
    if (currentUser(req).role !== 'system_admin') return res.status(403).json({ error: 'System administrator access required.' });
    const tenant: HospitalTenant = { ...req.body, id: req.body.id || `tenant-${randomBytes(12).toString('hex')}` };
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
    const user = currentUser(req);
    if (user.role !== 'system_admin' && user.tenantId !== req.params.id) return res.status(403).json({ error: 'You can only update your assigned hospital.' });
    const updated = await updateTenantInDb(req.params.id, req.body);
    res.json({ tenant: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update tenant', message: err.message });
  }
});

app.get('/api/v1/system-admin/user-hospital-mappings', async (req, res) => {
  if (!isSystemAdmin(req, res)) return;
  try {
    const [users, tenants] = await Promise.all([
      getDbPool().query("SELECT u.id, u.name, u.email, u.role, u.tenant_id, t.name AS tenant_name FROM app_users u LEFT JOIN tenants t ON t.id = u.tenant_id WHERE u.role <> 'system_admin' ORDER BY u.created_at"),
      getTenantsFromDb()
    ]);
    res.json({ users: users.rows, tenants });
  } catch (err: any) { res.status(500).json({ error: 'Failed to load hospital mappings', message: err.message }); }
});

app.put('/api/v1/system-admin/users/:id/hospital', async (req, res) => {
  if (!isSystemAdmin(req, res)) return;
  const { tenantId } = req.body;
  if (!tenantId) return res.status(400).json({ error: 'Select a hospital for this account.' });
  try {
    const result = await getDbPool().query("UPDATE app_users SET tenant_id = $1, session_version = session_version + 1 WHERE id = $2 AND role <> 'system_admin' RETURNING id, name, email, role, tenant_id", [tenantId, req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: result.rows[0] });
  } catch (err: any) { res.status(400).json({ error: 'Could not assign user to hospital.', message: err.message }); }
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
    const tenantId = currentUser(req).tenantId!;
    const patients = useDatabaseDataMode
      ? await getPatientsFromDb(tenantId)
      : SAMPLE_PATIENTS.filter(patient => HISTORICAL_DOCUMENTS.some(doc => doc.tenantId === tenantId && doc.patient.id === patient.id));
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
    const created = await createPatientInDb({ ...req.body, id: undefined }, currentUser(req).tenantId!);
    res.status(201).json({ patient: created });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create patient', message: err.message });
  }
});

app.put('/api/v1/patients/:id', async (req, res) => {
  try {
    const updated = await updatePatientInDb(req.params.id, req.body, currentUser(req).tenantId!);
    res.json({ patient: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update patient', message: err.message });
  }
});

app.delete('/api/v1/patients/:id', async (req, res) => {
  try {
    const success = await deletePatientFromDb(req.params.id, currentUser(req).tenantId!);
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

app.get('/api/v1/reports/search', async (req, res) => {
  try {
    const tenantId = currentUser(req).tenantId!;
    const allReports = useDatabaseDataMode ? await getDocumentsFromDb(tenantId) : HISTORICAL_DOCUMENTS.filter(doc => doc.tenantId === tenantId);
    const patientRows = useDatabaseDataMode
      ? await getDbPool().query('SELECT id, name, phone FROM patients WHERE tenant_id = $1', [tenantId])
      : { rows: [] as Array<{ id: string; name: string; phone: string }> };
    const currentPatients = new Map(patientRows.rows.map(patient => [patient.id, patient]));
    const reportsWithCurrentPatientData = allReports.map(report => {
      const patient = currentPatients.get(report.patient?.id || '');
      return patient ? { ...report, patient: { ...report.patient, name: patient.name, phone: patient.phone || undefined } } : report;
    });
    const name = String(req.query.name || '').trim().toLowerCase();
    const mobile = String(req.query.mobile || '').replace(/\D/g, '');
    const diagnosticType = String(req.query.diagnosticType || '').trim().toLowerCase();
    const documents = reportsWithCurrentPatientData.filter(doc => {
      const phone = (doc.patient?.phone || '').replace(/\D/g, '');
      const nameMatch = !name || `${doc.patient?.name || ''} ${doc.patient?.patientId || ''}`.toLowerCase().includes(name);
      const mobileMatch = !mobile || phone.includes(mobile);
      const typeMatch = !diagnosticType || `${doc.templateName} ${doc.modality}`.toLowerCase().includes(diagnosticType);
      return nameMatch && mobileMatch && typeMatch;
    });
    res.json({ count: documents.length, documents });
  } catch (err: any) { res.status(500).json({ error: 'Failed to search reports', message: err.message }); }
});

app.get('/api/v1/invoices', async (req, res) => {
  try {
    const from = typeof req.query.from === 'string' ? req.query.from : '';
    const to = typeof req.query.to === 'string' ? req.query.to : '';
    const isDate = (value: string) => !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value);
    if (!isDate(from) || !isDate(to)) return res.status(400).json({ error: 'Dates must use YYYY-MM-DD format.' });
    if (from && to && from > to) return res.status(400).json({ error: 'Start date must be on or before end date.' });
    let query = 'SELECT * FROM invoices WHERE tenant_id = $1';
    const params: Array<string> = [currentUser(req).tenantId!];
    if (from) { params.push(from); query += ` AND created_at >= $${params.length}::date`; }
    if (to) { params.push(to); query += ` AND created_at < ($${params.length}::date + INTERVAL '1 day')`; }
    query += ' ORDER BY created_at DESC';
    const result = await getDbPool().query(query, params);
    res.json({ count: result.rows.length, invoices: result.rows });
  } catch (err: any) { res.status(500).json({ error: 'Failed to fetch invoices', message: err.message }); }
});

app.put('/api/v1/invoices/:id', async (req, res) => {
  try {
    const tenantId = currentUser(req).tenantId!;
    const currentResult = await getDbPool().query('SELECT * FROM invoices WHERE id = $1 AND tenant_id = $2', [req.params.id, tenantId]);
    const current = currentResult.rows[0];
    if (!current) return res.status(404).json({ error: 'Invoice not found.' });
    const amount = req.body.amount === undefined ? Number(current.amount) : Number(req.body.amount);
    const status = req.body.status === undefined ? current.status : req.body.status;
    if (!Number.isFinite(amount) || amount < 0 || amount > 9999999999) return res.status(400).json({ error: 'Enter a valid non-negative invoice amount.' });
    if (!['DRAFT', 'ISSUED', 'PAID', 'CANCELLED'].includes(status)) return res.status(400).json({ error: 'Invalid invoice status.' });
    if (status !== 'DRAFT' && amount <= 0) return res.status(400).json({ error: 'Set a positive amount before issuing or closing an invoice.' });
    const saved = await getDbPool().query('UPDATE invoices SET amount = $1, status = $2, updated_at = NOW() WHERE id = $3 AND tenant_id = $4 RETURNING *', [amount, status, req.params.id, tenantId]);
    res.json({ invoice: saved.rows[0] });
  } catch (err: any) { res.status(500).json({ error: 'Failed to update invoice', message: err.message }); }
});

// ==========================================
// CLINICAL DOCUMENTS CRUD API
// ==========================================

app.get('/api/v1/documents', async (req, res) => {
  try {
    const { patientId, status } = req.query;
    const tenantId = currentUser(req).tenantId!;
    const docs = useDatabaseDataMode 
      ? await getDocumentsFromDb(tenantId as string, patientId as string, status as string)
      : HISTORICAL_DOCUMENTS.filter(doc => doc.tenantId === tenantId);
    res.json({ count: docs.length, documents: docs });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch documents', message: err.message });
  }
});

app.get('/api/v1/documents/:id', async (req, res) => {
  try {
    const tenantId = currentUser(req).tenantId!;
    const doc = useDatabaseDataMode
      ? await getDocumentByIdFromDb(req.params.id, tenantId)
      : HISTORICAL_DOCUMENTS.find(d => d.id === req.params.id && d.tenantId === tenantId);

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
    const { patient, templateId, modality, accessionNumber, referringPhysician, observations, previousDocumentId } = req.body;
    const tenantId = currentUser(req).tenantId!;
    
    let defaultPatient = patient;
    if (useDatabaseDataMode && patient?.id) {
      const patientRes = await getDbPool().query('SELECT id FROM patients WHERE id = $1 AND tenant_id = $2', [patient.id, tenantId]);
      if (patientRes.rows.length === 0) return res.status(403).json({ error: 'Patient is not assigned to your hospital.' });
    }
    if (previousDocumentId) {
      const previousRes = useDatabaseDataMode
        ? await getDocumentByIdFromDb(previousDocumentId, tenantId)
        : HISTORICAL_DOCUMENTS.find(doc => doc.id === previousDocumentId && doc.tenantId === tenantId);
      if (!previousRes) return res.status(403).json({ error: 'Previous study is not assigned to your hospital.' });
    }
    if (!defaultPatient && useDatabaseDataMode) {
      const patients = await getPatientsFromDb(tenantId);
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
      ? await getDocumentByIdFromDb(docId, currentUser(req).tenantId!)
      : HISTORICAL_DOCUMENTS.find(d => d.id === docId && d.tenantId === currentUser(req).tenantId);

    if (!existing) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const updated: ClinicalDocument = {
      ...existing,
      ...req.body,
      tenantId: currentUser(req).tenantId!,
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
    const tenantId = currentUser(req).tenantId!;
    const doc = useDatabaseDataMode ? await getDocumentByIdFromDb(docId, tenantId) : HISTORICAL_DOCUMENTS.find(d => d.id === docId && d.tenantId === tenantId);
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
      const prevDoc = useDatabaseDataMode ? await getDocumentByIdFromDb(doc.previousDocumentId, tenantId) : HISTORICAL_DOCUMENTS.find(d => d.id === doc.previousDocumentId && d.tenantId === tenantId);
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
    await createInvoiceForGeneratedReport(saved);
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

    const tenantId = currentUser(req).tenantId!;
    const doc = useDatabaseDataMode ? await getDocumentByIdFromDb(docId, tenantId) : HISTORICAL_DOCUMENTS.find(d => d.id === docId && d.tenantId === tenantId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const prevId = previousDocumentId || doc.previousDocumentId;
    if (!prevId) {
      return res.status(400).json({ error: 'previousDocumentId is required for comparative analysis' });
    }

    const prevDoc = useDatabaseDataMode ? await getDocumentByIdFromDb(prevId, tenantId) : HISTORICAL_DOCUMENTS.find(d => d.id === prevId && d.tenantId === tenantId);
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
    const tenantId = currentUser(req).tenantId!;
    const doc = useDatabaseDataMode ? await getDocumentByIdFromDb(req.params.id, tenantId) : HISTORICAL_DOCUMENTS.find(d => d.id === req.params.id && d.tenantId === tenantId);
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
    const tenantId = currentUser(req).tenantId!;
    const doc = useDatabaseDataMode ? await getDocumentByIdFromDb(req.params.id, tenantId) : HISTORICAL_DOCUMENTS.find(d => d.id === req.params.id && d.tenantId === tenantId);
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
    const tenantId = currentUser(req).tenantId!;
    const doc = useDatabaseDataMode ? await getDocumentByIdFromDb(req.params.id, tenantId) : HISTORICAL_DOCUMENTS.find(d => d.id === req.params.id && d.tenantId === tenantId);
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
  const tenantId = currentUser(req).tenantId!;
  const doc = document?.id
    ? (useDatabaseDataMode ? await getDocumentByIdFromDb(document.id, tenantId) : HISTORICAL_DOCUMENTS.find(d => d.id === document.id && d.tenantId === tenantId))
    : (useDatabaseDataMode ? (await getDocumentsFromDb(tenantId))[0] : HISTORICAL_DOCUMENTS.find(d => d.tenantId === tenantId));

  try {
    const chatResult = await processChatCoPilot(message, doc, template.fields, ragEnabled !== false);
    
    if (chatResult.extractedObservations && doc.id) {
      const currentDoc = useDatabaseDataMode ? await getDocumentByIdFromDb(doc.id, tenantId) : doc;
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
    const logs = useDatabaseDataMode ? await getAuditLogsFromDb(currentUser(req).tenantId!) : [];
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
      await ensureSystemAdminAccount();
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
