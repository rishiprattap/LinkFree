# Deployment guide — nothing has been deployed

## 1. Prepare Firebase

1. Create a Firebase project and register a web app. Copy the web configuration into `.env.local` using `.env.example`.
2. Enable **Email/Password** and **Google** under Authentication → Sign-in methods. Configure a support email and authorized domains (`localhost` plus your eventual canonical domain). Configure password policy, enumeration protection and email templates.
3. Create a Firestore database and Storage bucket in appropriate regions. Storage availability/billing requirements depend on your Firebase project; inspect your console. Set usage budgets and alerts.
4. Create a server service account with only the Auth, Firestore and Storage permissions needed. Keep its key exclusively in server secret storage. Set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`; never commit a key file. For managed GCP environments, adapt the Admin initializer to Application Default Credentials rather than exporting long-lived keys.
5. Generate an independent random 32+ character `ANALYTICS_SECRET`. Rotating it resets deduplication, rate identities and subscriber unsubscribe tokens. Plan a migration or reissue unsubscribe URLs if rotating.
6. Set `NEXT_PUBLIC_SITE_URL` to the exact browser origin. Use the same hostname in development (do not mix `localhost` and `127.0.0.1` for public API writes).

## 2. Validate locally

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run dev
```

Use `/studio` to evaluate without credentials. For integration verification, use a dedicated Firebase test project; the shipped client does not silently connect to emulators. The emulator configuration is included for security-rule tests or a future explicit emulator harness.

In the test project verify registration, email verification, Google popup, reset, token revocation, two-user username collisions, private/public access, save/reload, upload denial for wrong owner/type/size, scheduled boundary behavior, protected URL absence in HTML, password attempts/limits, analytics deduplication, subscription consent/unsubscribe, exports, and complete account cleanup.

## 3. Deploy rules — only after operator approval

Install/use Firebase CLI, sign in as the intended operator and select the intended project explicitly. Review the target before invoking any deploy command.

```sh
firebase deploy --only firestore:rules,firestore:indexes,storage --project YOUR_PROJECT_ID
```

Check both TTL policies in the Firestore console: collection groups `rateLimits` and `eventKeys`, field `expiresAt`. Verify they are active; TTL is asynchronous and may incur deletes/billing. If your CLI does not apply TTL from field overrides, enable the policies explicitly using the console or documented gcloud Firestore TTL command. No public client Firestore permissions should be granted.

## 4. Vercel (recommended)

1. Import the `linkfree` source folder/repository with Next.js detection. Build command `npm run build`; no static output directory override.
2. Add all environment variables to the correct environment. Client `NEXT_PUBLIC_*` values are embedded at build time, so rebuild when changing them.
3. Set the final canonical HTTPS origin in `NEXT_PUBLIC_SITE_URL` and `TRUSTED_PROXY=vercel`. The application trusts only the Vercel-sanitized IP/geo headers in this mode. Never set this value on a host where arbitrary clients can spoof those headers.
4. Add that host to Firebase Authentication authorized domains. Confirm the chosen auth domain supports the provider flow.
5. Review preview deployment data isolation: use a separate test Firebase project for untrusted previews. Do not expose production Admin secrets to untrusted PR builds.
6. After explicit approval, deploy and run the external verification checklist. No deployment was performed by the authoring agent.

## Custom domains

For the whole application, add and DNS-verify a domain in Vercel, set the canonical origin and update Firebase authorized domains. `domain.com/username` works normally.

For a creator-owned root domain, create a dedicated deployment, verify the domain, and set `CUSTOM_DOMAIN_OWNER_UID` to that creator’s UID (shown in Settings). The root then serves that published profile. Keep the same canonical origin in the deployment environment. This avoids trusting unverified Host headers. Links and generated QR codes use `/{username}` and still work; the root is an additional entry point. Automatic multi-tenant custom-domain provisioning is outside this implementation.

## Firebase Hosting alternative

This is a dynamic Node application, not a static Firebase Hosting bundle. To use Firebase Hosting, run the Next.js server in Cloud Run or another supported Node backend and configure Hosting rewrites to it. You must first implement/verify a trusted ingress adapter for that provider: the current application intentionally fails closed for public interactions in production unless `TRUSTED_PROXY=vercel`. Do not set `vercel` on Cloud Run or simply trust a user-supplied `X-Forwarded-For` header.

Firebase App Hosting may also support a managed Next.js workflow; confirm current provider support before choosing it. Neither Firebase dynamic hosting configuration nor a non-Vercel trusted-proxy adapter is claimed tested or shipped. Vercel satisfies the requested deployment target for this delivery.

## Before accepting real users

- Complete live integration and emulator security-rule tests; model tests alone are insufficient.
- Add your operator legal identity/contact to privacy and terms, provider agreements and retention policy.
- Enable HTTPS, project budgets, monitoring, backup/recovery and least-privilege service-account access.
- Test security headers on the final host, including Google auth and embeds; development CSP differs from production only for local tooling.
- Select an email provider for newsletters if needed, import only consenting addresses and preserve each unsubscribe URL.
- Load-test Firestore transaction contention and costs at anticipated traffic. Consider App Check, abuse controls, a queue and sharded aggregates for higher volume.
- Verify account deletion with Storage failures and document operator recovery. Do not claim all-or-nothing deletion across Firebase services.
