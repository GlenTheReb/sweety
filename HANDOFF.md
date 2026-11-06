# Shared Codex / Claude handoff

## Current state

Owner: Codex. Stage: verified; preparing submission draft for Glen's approval. Last updated: 6 November 2026.
Required stack: React, Express, PostgreSQL. Required outcomes: authenticated private reading CRUD, strict validation, calendar reports, meaningful tests, reproducible setup, seed and screenshots.
Submission requires Glen's confirmation. Nothing has been submitted.

Implemented: React journal, native reading dialog, Express cookie authentication, bcrypt, private CRUD, PostgreSQL constraints and future-date trigger, all three reports, seed and Docker database setup. Browser checks at 1440×1000 and 390×844 cover registration, login/reload, CRUD, required-value errors, month ranges, empty periods and logout. Screenshots are in docs/screenshots. The initial automated suite passed; final fresh-install check is in progress.

Clean install: a fresh archived checkout passed npm ci, migration to an empty database, seeding, all 12 tests and build. Secrets and SDD.md are ignored. Public repository: https://github.com/GlenTheReb/sweety.

Next: prepare the reply draft and request Glen's approval before sending. Read README.md and docs/VERIFICATION.md for commands/evidence. Do not claim Claude reviewed the project: no Claude review has occurred. The browser tool writes transient QA artifacts beneath Empl; screenshots were moved into Sweety and no Empl source/data files were edited.

## Codex to Claude

Review validation, user isolation, concurrent writes, date boundaries, setup instructions and accessibility once implementation is ready. Record concrete file references and reproduction steps below. Do not edit implementation while Codex owns it.
Local architecture pointer: SDD.md, Current status and execution pointer (line 3), Scope and architecture (line 7), Data and safety boundaries (line 11), Verification and remaining work (line 15).

## Claude to Codex

No review received yet. Add findings here with severity, file, reproduction, proposed fix and verification result. Keep resolved findings concise.

## Resume protocol

Read this file, inspect git status, read only relevant SDD.md sections, verify current evidence, and continue the next unfinished action. Before transferring ownership, update current state, checks run and remaining work. Shared files provide persistent context; they do not automatically send messages or transfer permission.
