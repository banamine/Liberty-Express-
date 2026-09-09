# PHASE 20B — AUTHENTICATED OWNERSHIP AUTHORIZATION CONTRACT

## Authorization

**APPROVED — IMPLEMENTATION AUTHORIZED within this contract.**

## Authentication

Provider: **Firebase Authentication**

Server-trusted principal:

`{ subjectId: verified Firebase uid, provider: "firebase", authenticated: true }`

The server must verify Firebase ID tokens using the Firebase Admin SDK. Client-supplied user IDs, owner IDs, roles, or claims must not establish authority.

## Ownership

An authenticated AJN operator owns the laboratory/channel schedule scope assigned to that Firebase UID.

Owner/operator permissions:

- read
- replace
- clear/tombstone

Viewer permissions:

- read only

Anonymous/public schedule reads:

**NO**

## Authorized persistence boundary

The minimum proposed server persistence consists of:

- `broadcast_schedules`
- `broadcast_schedule_access`

Owner authority remains on `broadcast_schedules.owner_firebase_uid`.

Viewer access is represented by explicit `VIEWER` access records.

## Authorized API boundary

- `POST /api/v1/schedules`
- `GET /api/v1/schedules/:scheduleId`
- `PUT /api/v1/schedules/:scheduleId`
- `POST /api/v1/schedules/:scheduleId/clear`

Expected semantics:

- missing/invalid authentication: 401
- authenticated without access: 403
- stale expected revision: 409
- invalid schedule payload: 422

Owner mutations must use server-derived Firebase UID and optimistic concurrency.

Clear must create a durable tombstone rather than physically deleting the schedule.

## Explicitly not authorized

- viewer-management routes
- anonymous/public schedule reads
- automatic localStorage migration
- additional roles
- organization/team ownership
- audit-table implementation unless separately approved
- unrelated playback/media changes
- SchedulerRuntime authority changes

## Migration

A schema migration is authorized only for the minimum approved schedule ownership/access boundary.

Before executing the migration, **verify the intended channel uniqueness invariant**. Do not blindly impose global `UNIQUE(channel_id)` unless existing architecture proves that one schedule per channel globally is required.

Existing browser-local `ajn-lab.schedule.v1` snapshots must not be automatically assigned to an authenticated user.

## Firebase configuration

Use Replit secure environment/secret configuration.

Required configuration identified during investigation:

- `FIREBASE_PROJECT_ID` — non-secret
- `FIREBASE_CLIENT_EMAIL` — secret
- `FIREBASE_PRIVATE_KEY` — secret

Never commit or expose credentials, tokens, private keys, or client secrets.

## Phase sequence

### Phase 1
Verify channel uniqueness, inspect final schema/API integration points, and confirm secure Firebase verification.

### Phase 2
Implement only the approved Firebase identity and schedule authorization boundary.

### Phase 3
Verify authentication, owner access, viewer read-only access, cross-owner denial, 401/403/409/422 behavior, and Phase 16–18 regressions.

**Hard stop:** if channel uniqueness or any additional architectural dependency cannot be established without further authorization, stop and report it.
