# System Architecture Overview

_Last updated: 2025-09-30_

## 1. Topology
```
+----------------------------+         +-----------------+
| Web Client (React, Vite)   |  HTTPS  |  API Gateway /  |
| - Admin / Faculty / Student| <-----> |  Express Server |
+----------------------------+         +--------+--------+
                                               |
                                               | REST RPC / Supabase SDK
                                               v
                                       +---------------+
                                       | Supabase      |
                                       | - Postgres DB |
                                       | - Auth / RLS  |
                                       | - Storage     |
                                       | - Edge Funcs  |
                                       +-------+-------+
                                               |
                                               | Background jobs (Edge Functions / Cloud Run)
                                               v
                                       +---------------+
                                       | Worker Pool   |
                                       | - Certificate |
                                       |   generation  |
                                       | - Email/SMS   |
                                       | - Scheduled   |
                                       +---------------+
```

## 2. Backend Application Layout
```
backend/
  src/
    app.ts            # Express bootstrap
    server.ts         # HTTP server
    config/
      env.ts          # Zod-validated environment variables
      supabase.ts     # Supabase service client + RLS helpers
    middleware/
      auth.ts         # session/JWT guards, role checks
      error-handler.ts
      validation.ts   # Zod schemas -> request validators
    modules/
      auth/
        auth.controller.ts
        auth.service.ts
        auth.router.ts
        auth.schemas.ts
      master-data/
        departments/
        academic-years/
        classes/
        subjects/
      users/
        faculty/
        students/
      mentoring/
      assessments/
      certificates/
    utils/
      logger.ts       # pino-based logger
      paginator.ts
    tests/
      integration/
      unit/
  package.json
  tsconfig.json
```

### Key Patterns
- **Controller-Service-Repository** split for separation of concerns.
- **Data validation** with Zod schemas shared across controllers and front-end (via shared package in phase 2).
- **Error handling** centralized with typed error classes (e.g., `DomainError`, `ValidationError`).
- **Role-based middleware** ensures minimal logic inside controllers.
- **Supabase Access Layer** exports typed query builders; encapsulates RLS bypass for service-role operations.

## 3. Front-End Application Layout
```
web/
  src/
    main.tsx
    app/
      routes/
        admin/
        faculty/
        student/
      layout/
      components/
        ui/           # Headless UI + Tailwind components
        forms/
        tables/
        charts/
      features/
        auth/
        master-data/
        mentoring/
        assessments/
        certificates/
    shared/
      api/
        client.ts     # OpenAPI generated client via Orval
        hooks.ts
      lib/
        rbac.ts
        formatting.ts
      store/
        query-client.ts (TanStack Query)
        auth-store.ts (Zustand)
  package.json
  vite.config.ts
  tailwind.config.ts
```

## 4. Data Access & Security
- Use **Supabase Row Level Security** for restrictive defaults; API server authenticates as service role but always includes `user_id` for audit.
- All data mutations go through stored procedures to enforce invariants (e.g., `assign_mentor`, `record_assessment_score`).
- `audit_logs` table populated via Postgres triggers capturing `OLD/NEW` values.
- Environment secrets are injected via `.env` (dev) and platform secret manager (prod).

## 5. Deployment Strategy
- Containerized services (Docker Compose for dev, separate images for API and Web).
- Production workflow:
  1. Git push -> GitHub Actions pipeline.
  2. Run lint/test/build for backend and web.
  3. Build Docker images.
  4. Deploy to Azure Web App / Render / Fly.io (configurable).
  5. Run smoke tests using Playwright.
- Supabase migrations managed via `supabase/migrations` directory synced with CLI.

## 6. Observability
- Pino logger streaming JSON to stdout.
- Health endpoint `/healthz` exposing build info, DB connectivity.
- Metrics via `prom-client` (Phase 2) -> Prometheus/Grafana.
- Error tracking with Sentry (Phase 2 optional).

## 7. Testing Strategy
- **Unit tests**: services + utilities (Vitest).
- **Integration tests**: API endpoints using Supertest with Supabase test schema.
- **E2E tests**: Playwright for web flows.
- **Static analysis**: ESLint, Prettier, TypeScript strict mode.

## 8. Migration Plan
1. Establish new `backend/` TypeScript service alongside legacy server.
2. Implement feature parity module-by-module while pointing web client to new endpoints.
3. Once parity achieved, decommission legacy `server.js` and related routes.
4. Clean dependency tree and update root scripts to orchestrate both packages.

## 9. Risks & Mitigations
- **Scope creep**: maintain backlog in GitHub Projects with clear milestones.
- **Supabase RLS misconfig**: add automated policy tests using Supabase CLI.
- **Data migration**: create idempotent seed/migration scripts; maintain backup snapshots before deploys.
- **Performance**: leverage Supabase's Postgres indexes, avoid N+1 queries via `select` with relations.

## 10. Next Steps
- Scaffold TypeScript backend (`backend/` folder) with basic server and health endpoint.
- Configure linting, formatting, testing pipeline.
- Port authentication module and master data endpoints.
- Build React front-end shell with authentication flow.
