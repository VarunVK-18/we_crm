## Startup Doctor – Developer Documentation

This single document compiles the entire developer documentation for the Startup Doctor monorepo: `frontend` (user app), `backend` (API), and `admin` (admin dashboard).

### Table of Contents

1. Architecture
2. Setup and Configuration
3. Local Development Workflow
4. Backend (Express + MongoDB)
5. Frontend (User App)
6. Admin Dashboard
7. Operations and Runbook
8. Contributing Guidelines

---

## 1. Architecture

The repository is a monorepo that contains three applications:

- `backend`: Node.js/Express API with MongoDB (Mongoose). Provides authentication, onboarding, health check assessments, user dashboard data, admin endpoints, and shareable report links.
- `frontend`: React 18 + TypeScript SPA for end-users (onboarding, health check, dashboard, reports). Uses Firebase Authentication and calls the backend with a Bearer token.
- `admin`: React 18 + TypeScript SPA for administrators (users, reports, dashboard). Uses a demo localStorage-based auth and calls admin endpoints.

### Data Flow

1. User signs in via Firebase on `frontend`. A Firebase ID token is stored client-side.
2. `frontend` calls `POST /api/auth/firebase-auth` to upsert the user in MongoDB.
3. Authenticated calls include `Authorization: Bearer <firebase_id_token>`.
4. Backend middleware `verifyFirebaseToken` decodes the token, resolves the user record, and attaches `req.user`.
5. `requireOnboarding` gates routes until onboarding is complete.
6. Health check data is persisted in a dedicated `HealthCheck` collection and aggregated for dashboards.
7. Shareable report links are created in-memory (Map) with an expiring hash (consider Redis/DB for production).
8. `admin` app queries admin endpoints for platform-wide metrics.

### Technologies

- Backend: Express, Mongoose, Helmet, CORS, Morgan, express-validator, jsonwebtoken
- Frontend: React 18 + TypeScript, React Router, Tailwind CSS, Firebase (Auth, Firestore)
- Admin: React 18 + TypeScript, React Router, Tailwind CSS
- Build: Vite
- Deployment: Backend configured with `vercel.json`; CORS allows localhost and production domains

### Services and Ports

- Backend: `PORT=3001` by default
- Frontend dev: `5173`
- Admin dev: `5174`

### Backend Middleware

- `verifyFirebaseToken`: Parses Bearer token, decodes Firebase token (development mode), loads `User` by Firebase UID, attaches `req.user`.
- `requireOnboarding`: Ensures `req.user.isOnboardingComplete === true` for gated endpoints.

### Routing Overview

- `/api/auth`: Firebase login/upsert
- `/api/users`: Dashboard and profile operations
- `/api/onboarding`: Status and completion
- `/api/health-check`: Save and query assessments
- `/api/shareable-reports`: Create and access shareable links
- `/api/admin`: Admin analytics (demo auth; implement RBAC for production)
- `/api/health`: Liveness probe

### Data Model Highlights

- `User`: Firebase UID, profile fields, onboarding state, timestamps
- `HealthCheck`: Per-user assessment records with scores, recommendations, strengths, risks
- `Subscription`: User subscription info and helpers like `getActiveForUser`

### Security Considerations

- Firebase token verification is relaxed for development (decoding only). Enable proper Firebase Admin verification in production.
- Shareable report storage is in-memory; replace with Redis/DB for persistence and multi-instance deployments.
- Admin app uses localStorage demo auth; replace with server-issued JWT and RBAC.

---

## 2. Setup and Configuration

### Prerequisites

- Node.js 18+
- npm 9+
- MongoDB Atlas connection string (or local MongoDB)
- Firebase project for `frontend` authentication

### Environment Variables

Create a `.env` file in `backend/`:

```
MONGODB_URL=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
NODE_ENV=development
PORT=3001
JWT_SECRET=change-me
```

Create a `.env` file (or `.env.local`) in `frontend/` with Firebase and API config:

```
VITE_API_BASE_URL=http://localhost:3001
VITE_FRONTEND_URL=http://localhost:5173

VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

Admin app uses a hardcoded API base (`https://api-wealthempires.vercel.app`). For local development against your local backend, update `admin/src/config/api.ts` to point to `http://localhost:3001`.

### Installation

From the repo root, install each app:

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../admin && npm install
```

### Running Locally

Terminals (one per app):

```bash
# Backend
cd backend
npm run dev

# Frontend (user app)
cd ../frontend
npm run dev

# Admin
cd ../admin
npm run dev
```

Open:
- Frontend: http://localhost:5173
- Admin: http://localhost:5174

---

## 3. Local Development Workflow

### Backend

- Start: `npm run dev` (uses `nodemon`)
- Logging: `morgan` in combined format
- Security: `helmet`, CORS configured for localhost and production domains
- Liveness: `GET /api/health`

Common routes:
- Auth: `POST /api/auth/firebase-auth`
- Users: `GET /api/users/dashboard`, `GET /api/users/profile`, `GET /api/users/subscription`
- Onboarding: `GET /api/onboarding/status`, `POST /api/onboarding/complete`, `PUT /api/onboarding/update`
- Health Check: `POST /api/health-check/save-results`, `GET /api/health-check/history`, `GET /api/health-check/latest`, `GET /api/health-check/stats`
- Shareable Reports: `POST /api/shareable-reports/create`, `GET /api/shareable-reports/:companySlug/:hash`, `GET /api/shareable-reports/user/list`, `DELETE /api/shareable-reports/:hash`
- Admin: See admin section; implement RBAC for production

### Frontend

- Start: `npm run dev` (Vite)
- Environment: `VITE_API_BASE_URL`, Firebase keys
- Auth: Firebase Auth; Protected routes check onboarding via backend

### Admin

- Start: `npm run dev` (Vite)
- Auth: Demo via localStorage (`admin@aistartupdoctor.com` / `admin123`)
- API base: `https://api-wealthempires.vercel.app` (update to `http://localhost:3001` for local testing)

### Coding Standards

- TypeScript for frontend/admin; Node.js CommonJS in backend
- Prefer descriptive function and variable names
- Avoid unnecessary try/catch; handle errors meaningfully
- Keep comments minimal and focused on non-obvious rationale

---

## 4. Backend (Express + MongoDB)

Location: `backend/`

### Tech Stack

- Express, Mongoose, Helmet, CORS, Morgan, express-validator, jsonwebtoken

### Configuration

- Env: `MONGODB_URL`, `PORT`, `NODE_ENV`
- CORS: Allows localhost (5173, 5174, 3000) and production domains

### Middleware

- `verifyFirebaseToken`: Decodes Firebase token, finds user by Firebase UID, sets `req.user`
- `requireOnboarding`: Rejects requests when onboarding incomplete

### Routes

- `app.use('/api/auth', require('./routes/auth'))`
- `app.use('/api/users', require('./routes/users'))`
- `app.use('/api/onboarding', require('./routes/onboarding'))`
- `app.use('/api/health-check', require('./routes/healthCheck'))`
- `app.use('/api/admin', require('./routes/admin'))`
- `app.use('/api/debug', require('./routes/debug'))`
- `app.use('/api/shareable-reports', require('./routes/shareableReports'))`

### Endpoints (selected)

- Auth
  - `POST /api/auth/firebase-auth` – Upsert/login user after Firebase auth

- Users
  - `GET /api/users/dashboard` – Aggregated user metrics (latest health check, averages, subscription)
  - `GET /api/users/profile` – User profile
  - `GET /api/users/subscription` – Active subscription

- Onboarding
  - `GET /api/onboarding/status` – Returns `{ isOnboarded }`
  - `POST /api/onboarding/complete` – Marks onboarding as complete
  - `PUT /api/onboarding/update` – Update onboarding data

- Health Check
  - `POST /api/health-check/save-results` – Persist assessment results
  - `GET /api/health-check/history` – All assessments for user
  - `GET /api/health-check/latest` – Latest assessment
  - `GET /api/health-check/stats` – Stats across assessments

- Shareable Reports
  - `POST /api/shareable-reports/create` – Create link; optional expiry
  - `GET /api/shareable-reports/:companySlug/:hash` – Public view endpoint
  - `GET /api/shareable-reports/user/list` – List user-created links
  - `DELETE /api/shareable-reports/:hash` – Revoke link

- Admin
  - `GET /api/admin/dashboard` – Platform-wide metrics (implement RBAC)
  - `GET /api/admin/users` – User listing
  - `GET /api/admin/users/:id` – User detail
  - `GET /api/admin/reports` – Reports listing
  - `GET /api/admin/reports/:userId/:reportId` – Report detail

### Models

- `User`: Firebase UID, email, profile, onboarding, timestamps
- `HealthCheck`: `userId`, `score`, `answers`, `recommendations`, `strengths`, `redFlags`, `risks`, timestamps
- `Subscription`: Active plan metadata, `getActiveForUser`

### Health and Observability

- `GET /api/health` for liveness
- Request logging via `morgan`

### Deployment

- `vercel.json` present for serverless deployment
- Ensure proper Firebase Admin token verification in production

---

## 5. Frontend (User App)

Location: `frontend/`

### Tech Stack

- React 18 + TypeScript, React Router, Tailwind CSS, Firebase (Auth, Firestore), Vite

### Configuration

- API base from `VITE_API_BASE_URL` with fallback to production URL in non-dev
- Firebase config from `VITE_FIREBASE_*` variables

### Routing

- Public: `/`, `/login`, `/shared-report/:companySlug/:hash`
- Protected: `/onboarding`, `/dashboard`, `/health-check`, `/reports`, `/profile/edit`

`components/ProtectedRoute.tsx` verifies:
- Logged-in status via `AuthContext`
- Onboarding status via `GET /api/onboarding/status`
- Registers user via `POST /api/auth/firebase-auth` if missing

### Key Pages

- `OnboardingPage`: collects company/founder details and completes onboarding
- `HealthCheckPage`: questionnaire and submission to backend
- `DashboardPage`: pulls aggregated metrics via `/api/users/dashboard`
- `ReportsPage`: lists assessments and scores
- `SharedReportPage`: renders public report via shareable link

### API Endpoints Used

See `src/config/api.ts` for the canonical list and helpers.

### State and Auth

- `contexts/AuthContext.tsx` integrates Firebase Auth
- ID token retrieved and attached to API calls requiring auth

---

## 6. Admin Dashboard

Location: `admin/`

### Tech Stack

- React 18 + TypeScript, React Router, Tailwind CSS, Vite

### Authentication (Demo)

- LocalStorage-based demo auth with credentials:
  - Email: `admin@aistartupdoctor.com`
  - Password: `admin123`
- Replace with server-issued JWT and RBAC in production

### Routing

- Protected: `/`, `/users`, `/users/:userId`, `/reports`, `/reports/:userId/:reportId`
- Login: `/login`

### APIs

- API base defaults to `https://api-wealthempires.vercel.app` (`src/config/api.ts`)
- For local testing, change to `http://localhost:3001`
- Endpoints:
  - `GET /api/admin/dashboard`
  - `GET /api/admin/users`, `GET /api/admin/users/:id`
  - `GET /api/admin/reports`, `GET /api/admin/reports/:userId/:reportId`
  - Health: `GET /api/health`

### Notes

- `ProtectedRoute` checks `useAdminAuth` for session
- `apiRequest` helper injects `Authorization: Bearer <token>` header when available

---

## 7. Operations and Runbook

### Health and Monitoring

- Liveness: `GET /api/health` returns status, timestamp, environment
- Logs: `morgan` (combined) in backend; review server logs for request tracing

### Common Issues

- 401 Unauthorized with `USER_NOT_FOUND`:
  - Frontend will attempt to register via `POST /api/auth/firebase-auth`
  - Ensure Firebase ID token is included as `Authorization: Bearer <token>`

- CORS errors:
  - Ensure origin is in the CORS whitelist in `backend/server.js`
  - For local development, use `http://localhost:5173` and `http://localhost:5174`

- MongoDB connection failures:
  - Check `MONGODB_URL` in `backend/.env`
  - Verify IP allowlist in Atlas

### Data Management

- Health checks stored in `HealthCheck` collection
- Users in `User` collection; Subscriptions in `Subscription`
- Shareable report links are in-memory; a process restart clears them

### Security

- Switch `verifyFirebaseToken` to full Firebase Admin verification for production
- Replace admin demo auth with proper RBAC and JWTs
- Move shareable-report store to Redis/DB with TTL

### Backups and Migrations

- Use MongoDB Atlas backup features
- Migration scripts present under `backend/scripts/`

---

## 8. Contributing Guidelines

### Branching and Commits

- Use feature branches: `feat/<short-description>`
- Conventional commits recommended: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`

### Code Style

- TypeScript in frontend/admin: explicit types for public APIs, avoid `any`
- Prefer descriptive names; avoid 1–2 character identifiers
- Use early returns to reduce nesting; handle errors meaningfully

### Reviews

- Small, focused pull requests
- Include testing steps and screenshots for UI changes

### Testing

- Manual verification for flows: login, onboarding, health check submission, dashboard rendering
- Add unit tests where practical

---


*Startup Doctor - Empowering startups with compliance intelligence*
