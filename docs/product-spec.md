# University Management Platform – Product Specification

_Last updated: 2025-09-30_

## 1. Vision
Deliver a full-stack university operations platform that supports admissions, academic management, mentoring, assessments, certification, and compliance. The solution must be secure, responsive, role-aware, and production-ready with automated tests, CI/CD hooks, and deployment documentation.

## 2. User Personas & Goals
- **Institution Admin (University HQ)**
  - Maintain master data: departments, academic years, classes, subjects, courses.
  - Administer faculty and student accounts; reset credentials, manage roles.
  - Configure assessment windows, mentoring assignments, institutional announcements.
  - Monitor dashboards across departments, compliance exports.
- **Department Admin (HOD / Coordinator)**
  - Manage department-specific classes, timetables, subject faculty assignments.
  - Approve student requests, generate departmental reports, manage internships.
- **Faculty / Mentor**
  - Manage enrolled students, attendance, assessments, marks, feedback.
  - Upload bulk marks via Excel/CSV templates, track progress.
  - Initiate mentorship notes, counseling schedules, issue certificates.
- **Student**
  - View profile, timetable, marks, attendance, download certificates.
  - Submit requests (leave, mentorship, grievances), upload documents.
- **Verifier / External Agency**
  - Validate certificates via QR/OCR pipeline.

## 3. Core Modules & Features
1. **Authentication & Authorization**
   - Supabase-backed identity; bcrypt password hashing; MFA-ready.
   - Session + JWT hybrid; refresh tokens; password reset flow; audit trails.
   - Role-based access control (RBAC) & row-level security (RLS) for Supabase.
2. **Master Data Management**
   - Departments, academic years, classes/sections, subjects, faculty designations.
   - CRUD with optimistic UI, change history, exports.
3. **User Lifecycle**
   - Admin-managed onboarding for faculty & students (manual, CSV import, Supabase functions).
   - Self-service profile updates with approval workflow.
   - Bulk actions (activate/deactivate, assign mentors, reset passwords).
4. **Mentoring & Advising**
   - Assign mentors to classes or student cohorts.
   - Maintain mentoring sessions, notes, outcomes; analytics dashboards.
5. **Attendance & Timetable (Phase 2)**
   - Faculty mark attendance; students view history; auto email for defaulters.
   - Timetable management, ICS subscription.
6. **Assessments & Marks**
   - Internal assessment configuration per subject/semester.
   - Marks entry (manual + Excel upload), validation, moderation workflow.
   - Student dashboards with grade analytics.
7. **Certificate Management & Verification**
   - Generate digital certificates with QR code, track issuance.
   - Public verification portal with OCR + QR fallback.
8. **Dashboards & Reporting**
   - Role-specific dashboards (admin > KPI overview, faculty > class health, student > progress).
   - CSV/PDF exports, scheduled emails, Supabase materialized views.
9. **Notifications & Communications (Phase 2)**
   - Email/SMS templates, event-based triggers.
10. **Audit & Compliance**
    - Change logs, download trails, Supabase storage for documents.

## 4. Non-Functional Requirements
- **Security**: OWASP ASVS baseline, Supabase RLS defaults, secure cookies, JWT expiration, input validation with Zod.
- **Performance**: <300ms median API latency, pagination, Supabase indexes, caching for reference data.
- **Scalability**: container-friendly (Docker), modular architecture, 12-factor app.
- **Reliability**: Automated tests (unit/integration/e2e), GitHub Actions CI, seed scripts.
- **Observability**: Structured logging, health checks, Supabase monitoring hooks.
- **Accessibility**: WCAG 2.1 AA front-end, keyboard-first UI, screen reader support.
- **Localization**: i18n-ready (phase 2).

## 5. High-Level Data Model
- `departments (id, code, name, description, head_id)`
- `academic_years (id, code, start_date, end_date, status)`
- `classes (id, department_id, academic_year_id, name, section, capacity, mentor_id)`
- `subjects (id, code, name, credit, semester, department_id)`
- `faculty (id, faculty_code, user_id, department_id, designation, status, profile)`
- `students (id, register_number, user_id, class_id, department_id, parent_contact, status, profile)`
- `mentorship_sessions (id, mentor_id, student_id, session_date, notes, follow_up)`
- `assessments (id, subject_id, type, max_score, weightage, schedule)`
- `marks (id, assessment_id, student_id, score, graded_by)`
- `certificates (id, student_id, type, issue_date, qr_payload, document_url)`
- `audit_logs (id, actor_id, action, entity, payload, created_at)`
- `notifications (id, recipient_id, channel, title, body, status, sent_at)`

## 6. API Surface (Phase 1)
- `/auth`: login, logout, refresh, password reset.
- `/admin/departments`: CRUD, search, export.
- `/admin/academic-years`: CRUD, activate/deactivate.
- `/admin/classes`: CRUD, assign mentors, capacity management.
- `/admin/subjects`: CRUD, link to departments & faculty.
- `/admin/users/faculty`: list/create/update/disable, CSV import.
- `/admin/users/students`: list/create/update/disable, bulk upload.
- `/faculty/dashboard`: summary, mentee list, pending actions.
- `/faculty/assessments`: configure, publish, mark entry.
- `/faculty/mentoring`: session logs, tasks.
- `/students/profile`: personal data, academic stats.
- `/students/marks`: subject-wise, semester-wise summary.
- `/certificates/verify`: OCR + QR verification endpoint.

## 7. Front-End Applications
- **Web App (`/app`)**: React + TypeScript + Tailwind. Shell with role-aware routing.
  - _Admin workspace_: master data, audits, bulk actions.
  - _Faculty workspace_: class dashboard, marks, mentoring.
  - _Student workspace_: timetable, marks, requests.
- **Public Verification Portal**: lightweight Next.js/Vite micro-app for certificate validation.

## 8. Roadmap & Milestones
1. **Foundations (Week 1)**
   - Finalize schema & RLS policies in Supabase.
   - Scaffold backend (Express + TS) with modular architecture.
   - Implement auth + RBAC + core master data endpoints.
2. **Admin & Faculty Workflows (Week 2)**
   - Build admin dashboard UI, faculty management flows.
   - Implement mentoring + assessment ingestion.
3. **Student Experience (Week 3)**
   - Student dashboard, marks visualization, requests.
4. **Certificates & Verification (Week 4)**
   - Certificate generator, QR/OCR pipeline, public portal.
5. **QA & Launch (Week 5)**
   - Automated tests, performance tuning, docs, deployment guide.

## 9. Open Questions
- Does the university require integration with ERP/HRMS (single sign-on)?
- Preferred notification channels/providers (SMTP/SMS)?
- Data retention policies for audit logs and certificates?
- Branding assets for UI theming (logos, colors)?

## 10. Acceptance Criteria for MVP
- All roles can authenticate and see personalized dashboards.
- Admin can CRUD departments, academic years, classes, subjects, faculty, students.
- Faculty can record mentoring sessions and upload marks.
- Students can view profile and marks.
- Certificate verification portal validates seeded certificates.
- Automated test suite (≥70% coverage for services/controllers) passes.
- CI pipeline runs lint/test/build.
- Documentation (README, deployment guide, API reference) delivered.
