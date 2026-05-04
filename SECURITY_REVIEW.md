# Security Review (2026-05-04)

## Findings

### 1) Unvalidated persistent deserialization from `localStorage` allows persistent state corruption / DoS-by-data
- **Where:** `game.js` `loadMetaProgress()` and `loadBestRun()` parse attacker-controlled `localStorage` and trust fields with no type/range checks.
- **Impact:** Any script running on the same origin (including browser extensions, compromised third-party scripts on the same host, or a user self-modifying state) can persist malformed values (e.g., strings, negative numbers, extreme values, objects) that break game invariants, produce `NaN` math propagation, or soft-lock logic across sessions.
- **Why this is a security issue:** This is insecure deserialization of untrusted persistent data in the browser context. While it does not enable RCE here, it enables persistent integrity loss and denial-of-service behavior.
- **Fix:** Validate parsed objects with a strict schema (numeric fields only, bounded ranges, defaults on invalid), and reject unknown keys before merging.

### 2) GPL-3.0 distribution compliance risk: third-party asset provenance not documented
- **Where:** `assets/` contains numerous image files, but repository documentation does not provide per-asset license/provenance metadata.
- **Impact:** If any asset is sourced under non-GPL-compatible terms (or without redistribution rights), open-source distribution can violate copyright terms despite GPL-3.0 code licensing.
- **Why this is a security/compliance issue:** Licensing non-compliance is a legal supply-chain risk that can force takedowns or re-licensing.
- **Fix:** Add an `ASSETS_LICENSES.md` (or SPDX manifest) listing each asset, source URL/author, exact license, and compatibility status.

## Scope checks completed
- Command injection: no shell/process execution paths found.
- Path traversal: no filesystem path handling APIs used.
- Hardcoded secrets: none found.
- Unsafe dependencies: no package manager / external runtime dependencies present in-repo.
- Race conditions & info-leaking error handling: no server-side concurrency surfaces; no sensitive exception disclosure observed.
