# AJN Operational Data

This directory is the Git-backed data boundary for the Express player.

## Purpose

Operational schedules, playlists, channel manifests, and related machine-readable data may be synchronized here for Express consumption.

## Source of truth

The operator's local Git working copy is the authoring source.

GitHub is the synchronized/versioned copy.

Git workers may validate and synchronize files but must not invent or rewrite operator content.

## Security

**This repository is currently public.**

Anything committed under `data/` is publicly readable.

Therefore do not place the following here:

- passwords
- API keys
- private keys
- access tokens
- credentials
- private personal information
- operational data that must remain confidential

If operational data must be private, use a separate **private GitHub repository** and configure Express/Git workers to consume that repository securely.

## Supported content

Prefer deterministic, versioned formats:

- JSON
- M3U/M3U8
- UTF-8 text

Every structured file should declare its schema/version where practical.

## Suggested layout

`data/`
`├── channels/`
`├── playlists/`
`├── schedules/`
`└── manifests/`

Empty directories are represented by future files; Git does not track empty directories.

## Static player

The existing public GitHub static player is intentionally unchanged.

It remains a load-and-go page and is not an operational data editor.

## Express

Express may consume data from a configured local checkout or synchronized Git checkout.

No public write API is implied by this directory.
