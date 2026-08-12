# Chakkra Clinical Document Intelligence Engine 🏥⚡

> **AI-Powered Radiology Report Generation & Structured Document Management System**

Chakkra Clinical Intelligence is a full-stack medical reporting application designed for radiologists, imaging centers, and hospitals. It combines **Gemini 3.6 Flash Multimodal RAG Co-Pilots**, **Web Speech Dictation**, **FHIR R4 DiagnosticReport Standards**, and a **PostgreSQL DDL Migration Engine** for automated, error-free clinical report creation.

---

## 🚀 Key Features

- **Executive Clinical Dashboard**: Aggregates study volumes, highlights missing patient demographics/indications, tracks completion statuses (Draft, Pending, Finalized), and provides real-time modality analytics.
- **Multimodal DICOM & Document Intelligence**: Leverages Gemini 3.6 Flash to analyze ultrasound, CT, MRI, and X-Ray scans, extracting structured measurements, anatomical findings, and impression summaries.
- **Hands-Free Speech Dictation**: Voice-to-text integration using native Web Speech API with real-time waveform audio visualization and immediate AI assistant extraction.
- **Dynamic Structured Templates**: Modality-specific forms (US Abdomen/Pelvis, CT Chest, Brain MRI, Chest X-Ray) with field validation, unit indicators, and auto-generated impression bullets.
- **Multi-Tenant Facility Branding**: Dynamic letterhead configuration for individual hospital tenants, including accredited logos, registration details, and digital signatures with cryptographic verification hashes.
- **Interoperability & Auditing**: Native export in **FHIR R4 DiagnosticReport JSON**, **DICOM Structured Reporting (SR)**, print-ready PDF preview, and immutable FHIR audit logging.

---

## 🗄️ Database Architecture & Migration Engine

Chakkra includes a built-in PostgreSQL DDL migration and schema engine located in `src/db/`.

### Relational Schema Tables (`src/db/schema.ts`)

| Table Name | Description | Key Attributes / Constraints |
| :--- | :--- | :--- |
| `tenants` | Hospital / Imaging Facility profiles | `id`, `name`, `code` (UNIQUE), `header_title`, `address`, `accreditation` |
| `practitioners` | Radiologists and Physicians | `id`, `name`, `qualification`, `registration_no` (UNIQUE), `designation` |
| `patients` | Patient Demographics & UHID | `id`, `patient_id` (UHID UNIQUE), `name`, `age`, `gender`, `dob`, `phone` |
| `templates` | Modality Structured Forms | `id`, `name`, `modality`, `version`, `fields_json` |
| `clinical_documents` | Radiology Studies & Reports | `id`, `tenant_id` (FK), `patient_id` (FK), `accession_number` (UNIQUE), `status` |
| `audit_logs` | Security & Revision History | `id`, `document_id` (FK), `actor`, `action`, `details`, `timestamp` |

---

## ⚙️ Environment Variables & Configuration

Copy `.env.example` to `.env` to configure database connection parameters and API keys:

```bash
cp .env.example .env
```

### `.env` File Example

```env
# Gemini API Key (Inject Secrets via AI Studio or local environment)
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Application Hosting URL
APP_URL="http://localhost:3000"

# ==============================================================================
# Database Connection Configuration & Migration Settings
# ==============================================================================
# Full PostgreSQL Connection String
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chakkra_clinical_db?sslmode=disable"

# Individual Database Connection Parameters (Fallback)
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="postgres"
DB_PASSWORD="postgres_password"
DB_NAME="chakkra_clinical_db"
DB_SSL="false"

# Data Source Toggle Flags ("DATABASE" or "SAMPLE")
# Set USE_DATABASE_DATA="true" (or DATA_SOURCE="DATABASE") to load records directly from PostgreSQL DB
# Set USE_DATABASE_DATA="false" (or DATA_SOURCE="SAMPLE") to use structured in-memory sample datasets
USE_DATABASE_DATA="false"
DATA_SOURCE="SAMPLE"

# Migration Settings
MIGRATION_DIR="src/db/migrations"
MIGRATIONS_TABLE="_sql_migrations"
AUTO_RUN_MIGRATIONS="true"
```

---

## 🔀 Data Source Flag (`USE_DATABASE_DATA`)

You can control whether the application loads clinical records directly from the **PostgreSQL Database** or from **Structured In-Memory Sample Datasets** using environment flags or the interactive header badge:

### 1. Environment Configuration Flag
- Set `USE_DATABASE_DATA="true"` or `DATA_SOURCE="DATABASE"` in `.env` to pull live records from PostgreSQL.
- Set `USE_DATABASE_DATA="false"` or `DATA_SOURCE="SAMPLE"` in `.env` to load structured in-memory datasets (`HISTORICAL_DOCUMENTS`).

### 2. Interactive UI Toggle Badge & REST API
- **Header Badge**: Click the **Data Source: DB / Sample Data** badge in the top navigation bar to toggle modes at runtime.
- **REST Endpoints**:
  - `GET /api/v1/config/data-source`: Returns current active mode (`DATABASE` vs `SAMPLE`), connection test status, and sanitized DB config.
  - `POST /api/v1/config/data-source`: Toggles or updates active data source mode.

---

## 📜 Database Migration Scripts & Commands

Manage database schema creation and data seeding with the npm scripts below:

| Command | Description |
| :--- | :--- |
| `npm run schema` | Outputs TypeScript and SQL schema table declarations |
| `npm run db:migrate` | Runs the DDL migration engine (`src/db/migrate.ts`) and executes SQL migrations |
| `npm run db:seed` | Seeds default hospital tenants, radiologists, patients, and sample studies |

### Running Migrations Manually

```bash
# Execute DDL Migrations
npm run db:migrate

# Seed Initial Sample Data
npm run db:seed
```

---

## 🛠️ Project Setup & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The application runs on `http://localhost:3000`.

### 3. Build & Production Start
```bash
# Compile client assets and backend server bundle
npm run build

# Launch production server
npm run start
```

---

## 📂 Project Directory Structure

```
├── .env.example               # Environment variables template with DB settings
├── .env                       # Local environment secrets and DB connection configuration
├── server.ts                  # Express backend server with Gemini 3.6 Flash endpoints
├── src/
│   ├── components/            # React UI components (Dashboard, ReportStudio, VoiceRecording, etc.)
│   ├── data/                  # Radiology templates & sample data
│   ├── db/                    # Database architecture
│   │   ├── config.ts          # Environment DB configuration loader
│   │   ├── schema.ts          # TypeScript schema definitions & DDL statements
│   │   ├── schema.sql         # Raw PostgreSQL DDL file
│   │   ├── migrate.ts         # Migration execution script
│   │   ├── seed.ts            # Database seed script
│   │   └── migrations/        # Versioned SQL migration files
│   ├── hooks/                 # Custom React hooks (useSpeechRecognition)
│   ├── services/              # Client API proxies
│   └── types.ts               # Core clinical TypeScript interfaces
└── README.md                  # Project documentation
```

---

## 🔒 Security & Compliance

- **Digital Signatures**: Reports are signed with cryptographic SHA256/MD5 PKI hashes incorporating radiologist registration IDs (`TNMC-89412`).
- **FHIR Audit Trails**: Immutable log records generated for every document state transition (`DRAFT` → `PRELIMINARY` → `APPROVED` → `DIGITALLY_SIGNED`).
- **Zero API Key Exposure**: All Gemini AI prompts and third-party secrets remain strictly on the Express backend server (`/api/*`).
