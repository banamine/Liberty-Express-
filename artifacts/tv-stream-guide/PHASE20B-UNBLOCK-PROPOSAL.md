# PHASE 20B — UNBLOCK INVESTIGATION RESULT

## Classification

**BLOCKED — AUTHORIZATION REQUIRED**

This investigation was read-only. No implementation was performed.

## Firebase findings

- Firebase Authentication is approved.
- No Firebase configuration existed in the repository/environment at investigation time.
- No Firebase connector was available in the Replit integration catalog.
- `firebase-admin` was not installed.
- The Node.js/Express server can support secure Firebase verification after configuration.

Proposed server verification:

- Firebase Admin SDK
- `Authorization: Bearer <Firebase ID token>`
- `verifyIdToken`
- principal derived from verified `decodedToken.uid`

Required secure configuration:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

## Existing schedule findings

- Schedules currently exist in browser-local persistence.
- Storage key: `ajn-lab.schedule.v1`
- SchedulerRuntime owns active schedule state.
- No server schedule repository exists.
- No schedule API routes exist.
- No ownership-bearing schedule schema exists.
- Existing `media_feeds` data cannot safely represent schedule ownership.

## Proposed minimum server persistence

### broadcast_schedules

- schedule_id
- channel_id
- owner_firebase_uid
- revision
- lifecycle: ACTIVE/CLEARED
- schedule_payload
- created_at
- updated_at
- cleared_at

### broadcast_schedule_access

- schedule_id
- principal_firebase_uid
- role: VIEWER
- created_at

Owner authority remains on the schedule owner field. Viewer access is explicit.

## Proposed API

- POST /api/v1/schedules
- GET /api/v1/schedules/:scheduleId
- PUT /api/v1/schedules/:scheduleId
- POST /api/v1/schedules/:scheduleId/clear

## Migration safety

Existing localStorage schedules must not be automatically imported or assigned to a Firebase UID.

A migration is required because the current database has no schedule ownership/revision/lifecycle/access representation.

## Follow-up authorization

The investigation established that implementation requires authorization for:

1. the new schedule API boundary;
2. the ownership/access schema;
3. secure Firebase server configuration;
4. an explicit decision on channel uniqueness before migration.

Viewer-management functionality remains outside this authorization and must not be invented.

## Evidence

- git diff --check: PASS
- no project files changed during the investigation

**STOP condition reached correctly.**
