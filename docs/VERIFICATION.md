# Verification ledger

Verified locally on Windows, 26 October 2026. No Firebase credentials were supplied and nothing was deployed or published.

## Automated checks

| Check | Result / boundary |
|---|---|
| TypeScript | Passed independently and during the production build |
| Unit/model tests | 13 tests passed across two files |
| Production dependency audit | `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities after Firebase upgrades and patched gRPC override |
| Next.js production build | Passed completely with Webpack, including type checking, page generation and build tracing |
| Local HTTP smoke suite | Passed: six page routes 200, unauthorized owner API 401, unknown profile 404, unconfigured public API 503, cross-origin mutation 403; security headers present |
| Live Firebase / emulator rules | Not run; requires operator configuration/test environment |

Tests cover URL and username validation, CSS restrictions, schedule boundaries, protected-link redaction, embed host/path restrictions, salted password hashing, same-origin checks, revocation-checked auth, streaming body size limits, durable-limit behavior and daily analytics deduplication. Database transactions in server tests are mocked: they do not validate Firestore deployment, concurrency behavior or Security Rules.

## Browser checks

- Local studio renders at desktop (1440px) and narrow mobile (375px viewport override) sizes. The measured mobile document width matched its client width; no horizontal overflow.
- Added a test link. A `javascript:` destination was rejected; a valid HTTPS destination saved.
- Moved the link using ordering controls, disabled it, and reloaded. Order and disabled state persisted; the disabled link was absent from the public preview.
- Switched to the dark theme and opened mobile live preview. Profile colors and buttons updated.
- Desktop sidebar collapse/expand worked.
- Analytics showed zero real events and an explicit Firebase requirement; no synthetic chart values.
- QR generation returned a valid PNG data URL (28,046 encoded characters for the tested URL). The in-app browser did not emit a completed download event, so actual QR file download completion remains unverified in this browser.
- Browser console had no captured errors during these flows.
- Mobile navigation and preview-button accessibility issues discovered during QA were corrected and rechecked in the final build. Hidden navigation is absent from the mobile accessibility tree; analytics no longer displays an inapplicable Preview button.
- A global loading boundary initially caused streamed missing-profile pages to return 200. Moving the boundary to the dashboard restored a verified 404 response.
- REA captured the final desktop studio in a clean temporary Chromium profile at 1440×1000. Evidence `ev_651a56685cd642118eaf951a72cf8d8bc272ffc0c7becbcfda175eecd932d79d`; screenshot saved as `desktop-preview.png`. This observes the default local sample, not a live Firebase account.

The local QA draft contains a disabled test link in this browser only; it is not part of the shipped default sample data or any Firebase database.

## Required external acceptance checks

Do not claim production readiness until these are completed on a dedicated Firebase project and then the approved deployment:

1. Email/Google registration and sign-in, email delivery/reset/verification, refresh and revoked sessions.
2. Two-user concurrent username claim collision and ownership isolation.
3. Firestore deny-by-default rules and Storage owner/type/size limits using the emulator suite and deployed rules.
4. Real profile/link CRUD persistence, avatar upload, password unlock, scheduling at exact boundaries and public secret redaction.
5. Real analytics persistence, trusted proxy metadata, cross-instance limits and contention/load behavior.
6. Consent storage, subscriber export/delete, unsubscribe after unpublishing or renaming.
7. QR download in the deployment’s target browsers; clipboard/Web Share and third-party embed playback.
8. Auth/Firestore/Storage account cleanup, including provider failures and operator recovery.
9. Custom-domain DNS verification, canonical metadata/social crawlers, production CSP and security headers.
10. Accessibility testing with keyboard and screen reader, contrast checks for user-selected palettes, performance/load review and backups/retention.

## Tooling notes

The empty initial workspace had no repository to modify. REA was available and successfully captured the public Linktree homepage; its evidence and research limitations are in `RESEARCH.md`.

The Windows sandbox could not resolve npm DNS and blocked some local sockets/filesystem worker operations. Approved network/process access was used for dependency installation and local build/preview checks. Turbopack also failed outside the sandbox when starting its CSS worker, so project scripts use the supported Webpack path. No application behavior was replaced with a mock to make the production build pass.

The Firebase client package pinned an older gRPC dependency even after upgrading to Firebase 13.1.0. The package override selects patched `@grpc/grpc-js ^1.14.6`; Firebase Admin is 14.5.0. These resolved production audit findings. Re-audit and re-test future dependency upgrades.
