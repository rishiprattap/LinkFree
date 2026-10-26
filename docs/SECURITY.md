# Security notes

## Boundaries

Firebase Admin modules import `server-only`. No service-account values are sent to the browser. Owner endpoints require a Firebase ID token and check revocation. Identity comes from the verified token, never a body UID. Same-origin checks accompany mutations; bearer authorization is not an ambient cookie and cross-origin browsers are not granted CORS access.

Firestore client access is denied globally. Storage grants write access only to `avatars/{authenticated UID}/avatar`, <=2 MiB, PNG/JPEG/WebP MIME types. SVG and HTML uploads are denied. MIME metadata is not content inspection; the UI decodes raster images and limits dimensions. Consider server re-encoding before exposing an installation to adversarial mass uploads.

Usernames are reserved/validated and claimed transactionally. URLs are protocol allowlisted; javascript/data and credential-bearing URLs are rejected. React escapes user text; no arbitrary HTML is rendered. Custom CSS is a three-property numeric allowlist, not an injected stylesheet. Embeds accept only exact YouTube/Spotify hosts and supported paths. Iframes are sandboxed and load on explicit selection.

Passwords are salted scrypt hashes held in private link documents. Public server responses strip both hashes and protected destinations. Unlock checks enforce current availability and durable per-visitor limits. A recipient can share a destination after unlocking; this does not protect the target website itself.

Durable rate-limit counters are transactional and fail closed. Public interactions: 90/minute per network/browser identity; unlocks: 10/15 minutes per profile/identity; subscriptions: 5/hour per identity. Owner API: 120/minute per UID. These limits are not distributed bot protection; rotating identities can evade them. Profile SSR reads are not rate-limited by this endpoint limiter—configure host-level traffic protection and spending controls.

Request bodies are read with a 20 KB cap. Type and length validation is server-side. Content Security Policy restricts scripts, frames, connections and uploads; the production policy needs inline scripts/styles for Next/React. No external arbitrary script or stylesheet feature exists.

## Residual integration work

- Run Firebase emulator rules tests and real project acceptance checks before production. Neither static review nor unit tests prove deployed rules.
- Confirm proxy headers cannot be spoofed on your actual ingress. Only Vercel is supported by the production adapter.
- Authentication provider and email delivery behavior require configured Firebase services and valid domains.
- Test deletion failure recovery across Firestore, Auth and Storage. Partial failure can require operator cleanup.
- Application-level analytics are approximate and abuse-sensitive. Per-day aggregate documents may need sharding at high write rates.

Report vulnerabilities privately to the operator of the installation. Add a real security contact before public launch.
