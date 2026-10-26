# Public feature research and implementation comparison

Research date: 2026-10-26. This document records inspiration and planned implementation, not a claim that every LinkFree feature has passed integration testing.

## Method and boundaries

Used the installed Reverse Engineer Anything skill and REA `capture_browser_scenario` against the public homepage, with a temporary headless Chrome profile, no cookies or credentials, and a bounded wait for the main heading. The second scenario captured accessibility text and a 1280×720 screenshot. It completed and terminated its owned browser process. No signup, account mutation, paid feature, proprietary source extraction, or access-control bypass was attempted. Official public homepage and pricing text were also read through web browsing.

REA evidence ID: `ev_523d7ccc94c47b089a68f374196664fd824e16ec3f1918fe513069dc4a329672` (controlled replay, observed). Browser: Chromium 155.0.8059.85. Screenshot SHA-256: `d2534f12b90531bb39e28f8d8c17113568b3756cee16190eb27313a01eadec7d`. Accessibility SHA-256: `18a0983ac6f9d03115d5da1e2019d20b0f5ec32cda8827b89b8828877f31b20d`. Complete within the requested capture; this does not establish complete product coverage. The screenshot remains research evidence, not an application asset.

## Observed public UX

The desktop homepage uses a prominent navigation bar, a large two-column hero, a username claim field, and a clear signup action. The content progresses from creation/customization to sharing and engagement analysis. Public navigation distinguishes features, integrations, resources, pricing, and login. Public examples and QR sharing communicate the value of one persistent profile address. The captured design uses vivid lime, dark green type, pill controls, and creator photography. LinkFree should use an independently designed visual system and original assets rather than reproduce these visual choices. [Homepage](https://linktr.ee/)

## Feature comparison

| Area | Public Linktree evidence | LinkFree implementation target |
|---|---|---|
| Public profile | One shareable address; QR promotion | Unique username route, profile information, links, native sharing, downloadable QR |
| Link count | Free advertises unlimited basic links | No subscription gates on link management |
| Appearance | Pro advertises custom designs and branding removal | Original themes, gradients, animation, fonts, button styling, constrained CSS |
| Audience | Public pages promote engagement analysis | First-party view/click events, aggregate trends, privacy-conscious unique estimate |
| Email | Free lists signups; Pro lists mailing integrations | Explicit-consent subscriptions, owner-only access/export |
| Premium scope | Premium lists routing, all-time analytics and export | Scheduling and protected links implemented independently; no subscription requirement |
| Ecosystem | Marketing includes commerce and social scheduling | Not requested: payments, social auto-replies, AI integrations, commerce marketplace |

Plan descriptions are marketing evidence, not authenticated verification. Tiers and availability can change. No pricing amounts are needed for LinkFree's design. [Official pricing and feature descriptions](https://linktr.ee/s/pricing)

## Technical plan

1. Use Next.js App Router and TypeScript with Tailwind, Motion, Lucide, and Recharts. Separate public profile data from private account, link secrets, subscribers, and analytics data.
2. Use Firebase Authentication for Google/email sign-in and password recovery. Reserve usernames atomically on the server. Authenticate owner endpoints using verified Firebase ID tokens or secure sessions.
3. Treat profile rendering and editing as shared components: public view uses persisted data; the editor preview uses drafts. Keep mobile controls accessible and support keyboard ordering alongside pointer drag-and-drop.
4. Validate all inputs on the server, constrain embed providers and URL schemes, and permit only a narrow CSS property/value subset. Never render unsanitized HTML or publish protected destinations in public documents.
5. Collect analytics through server endpoints with validation, rate limits, consent-aware privacy behavior, and real timestamps. Define metric denominators and retention. Trust country metadata only when provided by a verified hosting edge; otherwise show unknown.
6. Enforce owner-only private data with Firestore rules. Restrict Storage uploads by ownership, image MIME type, and size. Use environment variables for Firebase configuration; keep Admin credentials server-only.
7. Verify locally with type checking, build, focused validation/security tests and browser checks; use Firebase emulators for integration where available. Document any missing credentials or unexecuted integration tests rather than claiming production readiness.
8. Provide environment/setup documentation, indexes/rules, and hosting instructions. Deployment requires explicit user approval.

## Known research gaps

The authenticated dashboard, link scheduling, password flows, and paid customization were not exercised. No mobile screenshot or performance audit of Linktree was performed. Research does not establish Linktree's internal data model, API behavior, security design, analytics semantics, or feature reliability. LinkFree's architecture above is an independent engineering plan derived from the user's requirements. Public browser observation does not imply permission to redistribute Linktree imagery, text, or branding.
