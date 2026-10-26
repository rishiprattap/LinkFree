# LinkFree implementation plan

Independent Next.js App Router implementation. Original ink/mint visual identity, responsive editor, public profile renderer shared with a live preview. No copied Linktree code or assets.

1. Establish validated shared models, server-only Firebase Admin access, and deny-by-default rules.
2. Implement Firebase email/Google authentication, reset and verified server requests. Claim usernames atomically.
3. Store private profiles and individual link documents. Project only safe, currently visible fields into public pages. Enforce schedules and passwords again on redirect.
4. Build responsive link, profile, appearance, analytics, audience, sharing and settings panels. Provide explicit local-only studio for credential-free evaluation.
5. Record real server-side events with daily pseudonymous visitor keys, deduplication, transactional rate limits and aggregated daily/monthly charts. Never synthesize production metrics.
6. Add allowlisted style declarations, consent subscriptions, validated raster upload, restricted embeds, QR export and SEO.
7. Run TypeScript, meaningful security/model tests, production build and browser QA. Document credentials, hosting configuration, privacy limits and unverified integration paths.

Server endpoints use Firebase ID tokens with revocation checks; browsers never write Firestore directly. Storage allows only authenticated owner raster uploads <=2 MiB. Firebase Admin credentials stay server-only. A single host custom domain is selected by operator environment configuration, not visitor-supplied Host headers.

Production readiness requires integration checks against the operator's Firebase project, security rules deployment, trusted ingress configuration, billing/quotas and real provider sign-in tests. Local build success does not prove these external checks.
