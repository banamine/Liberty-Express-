# PHASE 20B — FILE-BACKED OWNERSHIP CONTRACT

## Classification

**PHASE 20B — FILE-BACKED OPERATOR CONTROL**

Firebase Authentication is removed from this design.

No external authentication provider is required.

## Core model

AJN uses an operator-controlled, Git-backed data model rather than public authentication.

The operator is the sole authorized writer of schedules, playlists, and controlled data.

The Express player may consume validated data from either:

1. the operator's local Git working copy; or
2. the synchronized GitHub repository data.

The static GitHub player remains unchanged. It is a load-and-go page and is outside this data/control change.

## Authority

Git is the durable change/audit mechanism.

The operator's local working directory is the primary authoring source.

GitHub is the synchronized repository copy.

Automated Git workers may synchronize/validate files, but they must not invent or modify schedule content without an explicit operator-authored change.

## Data layout

Use a dedicated repository data area:

`data/`

Recommended structure:

`data/`
`├── README.md`
`├── channels/`
`├── playlists/`
`├── schedules/`
`└── manifests/`

The exact subdirectories may be adjusted after repository inspection.

No secrets, credentials, private keys, tokens, or sensitive personal data belong in this directory.

## File contracts

Files must use deterministic, versioned, machine-readable formats.

Recommended:

- JSON for manifests and structured schedule/playlists;
- M3U/M3U8 where playlist interoperability requires it;
- UTF-8 text;
- stable IDs;
- explicit schema/version fields.

Every controlled data file should be independently parseable and validation should fail closed.

## Operator write authority

There is no public write API.

The browser/player must not expose arbitrary file mutation.

Changes occur through the operator's local Git workflow and controlled synchronization.

Recommended flow:

`Local data edit`
→ `validation`
→ `git diff`
→ `commit`
→ `push`
→ `GitHub`
→ `Git worker/sync`
→ `Express player`

## Express consumption

Express may resolve data from:

- a configured local data directory; or
- a configured synchronized Git checkout.

The source must be explicit and deterministic.

Do not silently fall back between sources when a configured source is unavailable.

A future implementation may expose a read-only server endpoint for validated data, but no write endpoint is authorized by this contract.

## Git workers

Git workers may:

- pull/fetch the authorized repository;
- validate manifests;
- validate schedules/playlists;
- detect revisions;
- synchronize files;
- report failures.

Git workers must not:

- create ownership;
- invent schedules;
- rewrite operator content;
- commit secrets;
- publish private data;
- bypass Git history.

## Public/private boundary

IMPORTANT: the current `banamine/Liberty-Express-` GitHub repository is PUBLIC.

A folder inside a public GitHub repository is also publicly readable.

Therefore:

- `data/` in this public repository MUST contain only data that is safe to publish; or
- sensitive/private data MUST be stored in a separate PRIVATE GitHub repository.

GitHub folder permissions cannot make one directory private inside a public repository.

The static player may remain public while private operational data is kept separately.

## Static player

Do not modify the existing GitHub static player solely for this architecture change.

It remains:

- public;
- load-and-go;
- unchanged.

The operational Express player/data path is separate.

## Local workflow

The operator may maintain a local working copy containing the authoritative operational data.

The local path must be configurable.

Do not hardcode a user-specific Windows path.

## Schedule semantics

Schedules remain deterministic and versioned.

Do not introduce Firebase ownership fields.

Do not introduce anonymous/public authorization semantics.

The operator's Git write access is the ownership boundary.

## Concurrency

Git revision/history provides the durable change history.

For conflicting edits:

- preserve Git history;
- do not silently overwrite;
- report conflicts;
- require operator resolution.

Runtime schedule revision/tombstone behavior remains governed by the existing SchedulerRuntime contract unless a later phase explicitly changes it.

## Protected systems

Do not modify unless a direct integration dependency requires a minimal change:

- SchedulerRuntime authority;
- EPG;
- Player lifecycle;
- HLS cleanup;
- Archive;
- News;
- media proxy;
- static GitHub player.

No duplicate playback pipeline.

## Phase sequence

### Phase 1 — Investigation

Confirm:

- current repository layout;
- existing playlist/schedule file formats;
- existing Express data-loading paths;
- Git worker capabilities;
- local data directory configuration;
- static player boundary;
- current GitHub public/private visibility.

### Phase 2 — Implementation

Implement only the file-backed data path and validation/synchronization boundary authorized by this contract.

### Phase 3 — Verification

Verify:

- local data source loads;
- Git-synchronized source loads;
- deterministic file selection;
- invalid data is rejected;
- Git changes are preserved;
- no public write path exists;
- static player remains unchanged;
- existing playback/EPG/scheduler regressions pass.

## Explicitly not authorized

- Firebase Authentication
- Firebase Admin SDK
- OAuth/OIDC authentication
- public schedule write APIs
- public data mutation
- database ownership migration
- speculative access-control roles
- viewer-management APIs
- changes to the static GitHub player

## Final boundary

**The operator is the only person authorized to change schedules/playlists through the Git-backed authoring workflow.**

The Express player is a consumer, not an editor.

GitHub synchronization is a transport/version-control mechanism, not an authentication provider.

**STOP if implementation would require making private operational data publicly readable.**
