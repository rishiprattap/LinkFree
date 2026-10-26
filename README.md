# LinkFree ✳

An independently built, MIT-licensed bio-link application. Next.js + TypeScript, Tailwind CSS, Firebase Authentication / Firestore / Storage, Framer Motion, Recharts, Lucide and QRCode. No subscriptions or feature paywalls in the codebase. Hosting and Firebase usage can incur costs.

## Hosting at linkfree.runs-on.dev

See [the domain setup guide](docs/LINKFREE-DOMAIN.md) for Vercel, Firebase, and DNS configuration. The website source is at this repository root; no static export is required. Hosting is not yet configured.

## Run locally

Requires Node.js 22+ and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. `/studio` is a clearly labeled, browser-local design playground that works without Firebase. Its sample links are illustrative, editable and stored in localStorage. It does not publish accounts, generate fake analytics, accept real subscriptions or enforce real passwords. `/dashboard` uses the real Firebase-backed application. `/auth` provides registration, Google sign-in, email sign-in and password reset.

Without credentials, Firebase actions fail closed with setup messages. Build and model tests can run without credentials. Never place Admin credentials in `NEXT_PUBLIC_*` variables.

```sh
npm run typecheck
npm test
npm run build
npm start
```

## What is implemented

- Firebase email/password registration, Google popup login, email verification, reset email, persistent client sessions, sign-out and revocation-checked server requests.
- Atomic username claims and renames, private/unpublished profile state, public `/{username}` pages.
- Individual link documents without a subscription cap; enable/disable, drag ordering and keyboard/touch move controls, CRUD, start/end schedules enforced on the server.
- Profile text, raster avatar upload, social icons, sharing, responsive public pages and live preview.
- Five original themes, light/dark palettes, custom colors, gradients, motion respecting reduced motion, local font stacks, button radius/shadow/glass, restricted CSS declarations.
- Password-protected links hashed with salted scrypt. Public payloads omit password hashes and protected destinations. Embeds remain locked until the password succeeds.
- Explicitly activated privacy-enhanced YouTube and restricted Spotify embeds; HTTP(S), email and telephone buttons.
- Real, daily aggregated views/clicks, daily unique estimates, CTR, daily/monthly charts, device/referral distributions; countries only from configured trusted ingress. Empty data stays empty.
- QR PNG download, Web Share / clipboard, server SEO metadata and generated social preview images.
- Consent-based subscriber collection, owner-only CSV export including per-subscriber unsubscribe links, subscriber deletion and public unsubscribe endpoint. No newsletter delivery service is bundled.
- Profile/link JSON export, account deletion including nested Firestore data and avatar files; account deletion requires a recent sign-in.
- Deny-by-default Firestore rules, owner/size/MIME-limited Storage rules, bounded request bodies, schema validation, transactional rate limiting, security headers and deployment instructions.

Implementation is not the same as live verification. See [verification status](docs/VERIFICATION.md) for checks run and external integration gaps. Do not treat this as a production certification.

## Configuration

Copy every value from your own Firebase project settings. Public Firebase app configuration is designed to be exposed; Admin private keys are not.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web app key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Authorized Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Exact bucket name from Storage settings |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase web app ID |
| `FIREBASE_PROJECT_ID` | Server Admin project ID |
| `FIREBASE_CLIENT_EMAIL` | Server service-account email |
| `FIREBASE_PRIVATE_KEY` | Server private key; escaped `\n` supported |
| `ANALYTICS_SECRET` | Independent random secret, at least 32 characters |
| `NEXT_PUBLIC_SITE_URL` | Canonical full origin, no trailing path |
| `TRUSTED_PROXY` | `vercel` on Vercel; `none` for development |
| `CUSTOM_DOMAIN_OWNER_UID` | Optional operator-selected profile at `/` |

The server must be configured together with the client. Public interactions fail closed in production if trusted ingress is not configured. No in-memory rate-limit fallback silently replaces durable limits.

## Architecture

```
Browser → Firebase Auth (ID token)
        → Next.js /api/owner/* (verify token + revocation)
        → Admin SDK → private Firestore records

Public page → server-filtered profile + active links
            → /api/public/:username (limits, schedule/password checks)
            → daily aggregate statistics / consenting subscribers

Avatar upload → Storage SDK → owner-scoped Storage rules
```

Firestore collections:

- `profiles/{uid}`: profile and theme; subcollections `links`, `stats`, `subscribers`.
- `usernames/{username}`: transactional unique ownership claim.
- `rateLimits/{hmac}`: time-bucket counters with TTL.
- `eventKeys/{hmac}`: daily event deduplication keys with TTL.

Only server code accesses Firestore. Admin SDK bypasses Security Rules, so endpoint authentication and schema validation are intentional security boundaries. Direct browser reads and writes are denied, including public profiles.

Custom CSS is parsed into a React style object. Allowed properties: `letter-spacing: 0–3px`, `font-weight: 400–800`, `border-width: 0–4px`. No selectors, imports, external fonts, URLs, scripting or arbitrary HTML. Fonts are sans, serif and mono system stacks; uploading font files is not supported.

## Analytics semantics

One view is counted per profile, estimated visitor and UTC day. One click is counted per link, estimated visitor and UTC day. A daily visitor key is derived with HMAC from the date, trusted IP identity and user agent; raw IPs are not saved. Summed daily uniques are **not** monthly distinct people. CTR is deduplicated clicks divided by deduplicated views and can exceed 100% when a visitor clicks multiple links. These are estimates, not ad-grade attribution.

Referrals use `document.referrer` reduced to hostname; it is client-supplied and may be absent or spoofed. At most 64 distinct referring hosts per day plus Other are retained to bound document growth. Device inference uses the user agent. Country is accepted only from Vercel’s proxy metadata when explicitly configured. Local use records no country and groups the local host as one IP identity. Bot traffic, shared networks, changing user agents and privacy tools affect counts.

Enable Firestore TTL for rate-limit and event-key documents; expired records may remain until Firebase’s asynchronous cleanup. Aggregate dates are retained until account deletion; the dashboard reads the latest 366 recorded dates. Large installations should add retention jobs, abuse detection, budget controls and sharded counters before high-volume use.

## Limits and deployment

- Primary supported deployment: **Vercel with the Node runtime**. Static export cannot run auth checks, analytics or password gates. [Deployment guide](docs/DEPLOYMENT.md).
- Custom domains are operator-verified Vercel domains. One optional root profile per deployment is supported; there is no automated tenant domain provisioning service.
- Subscriber email delivery and double-opt-in verification are not bundled. Consent and unsubscribe records are real; the operator/creator must integrate their mail provider and include unsubscribe links.
- Individual link records avoid the Firestore single-profile document size cap. The editor currently loads the whole link list, so very large accounts need pagination/virtualization. Numeric midpoint ordering should be rebalanced for unusually heavy repeated reorder workloads.
- Security Rules MIME checks are not malware scanning. The editor decodes the image and restricts dimensions, but adversarial API clients can bypass client-only checks. Serve uploads only as raster images; consider server-side re-encoding for hostile multi-tenant use.
- Account deletion spans Firebase services, so it is not atomic. If a provider fails mid-delete, the profile is unpublished and the operator must retry cleanup. TTL-only event keys and rate buckets expire separately.

See [research](docs/RESEARCH.md), [implementation plan](docs/PLAN.md), [security notes](docs/SECURITY.md), and [verification](docs/VERIFICATION.md).

## License and independence

MIT. LinkFree is not affiliated with Linktree. Public feature research informed the requirements; all source, layouts and decorative visuals were independently created. No proprietary Linktree code, paid features, branding or assets were copied.
