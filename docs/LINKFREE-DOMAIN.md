# Publish LinkFree at linkfree.runs-on.dev

The repository contains the website at its root. The intended production origin is **https://linkfree.runs-on.dev**. This guide does not mean the domain has been claimed, configured, or deployed.

## Vercel setup

1. In Vercel, import `rishiprattap/LinkFree`. Select Next.js, repository root, and Node.js 22.x. Keep the output directory at the framework default. `vercel.json` supplies the install and build commands.
2. Before deploying, copy the variable names from `.env.example` into Vercel's Production environment. Supply your existing Firebase web configuration and server credentials. Keep the Admin private key server-only. Never commit `.env.local` or a service-account JSON file.
3. Set `NEXT_PUBLIC_SITE_URL=https://linkfree.runs-on.dev` and `TRUSTED_PROXY=vercel`. Generate a random `ANALYTICS_SECRET` of at least 32 characters. Leave `CUSTOM_DOMAIN_OWNER_UID` empty: this deployment hosts the whole application, with profiles at `/username`.
4. Add `linkfree.runs-on.dev` to Firebase Authentication's authorized domains, enable Google and Email/Password providers, and deploy the Firestore/Storage rules for the correct existing Firebase project as described in [DEPLOYMENT.md](DEPLOYMENT.md).
5. After approving the deployment, deploy the project. Under Settings > Domains, add `linkfree.runs-on.dev`. Copy the **exact** CNAME target and any TXT verification record displayed by Vercel; do not guess the values.

## runs-on.dev setup

Sign in at [runs-on.dev](https://runs-on.dev/) with the owning GitHub account. Claim `linkfree` if available, or select your existing claim. A lookup of `domains/linkfree.json` returned 404 during preparation; that is not a reservation or guarantee of availability.

Open [Manage](https://runs-on.dev/manage) and configure the records requested by Vercel. Use a CNAME for the hostname, not a URL redirect, so visitors keep `linkfree.runs-on.dev` in their address bar. If Vercel requests a TXT record at a prefixed hostname, follow the registry's subdomain-record instructions. If the name is already owned by another account, it cannot be used without that owner's cooperation.

Wait until Vercel reports valid DNS and HTTPS. Do not change nameservers for the parent `runs-on.dev` domain, which you do not own. Changing `.env.example` alone does not configure production: set environment variables in Vercel and rebuild when any `NEXT_PUBLIC_*` value changes.

## Verify before sharing

- Open the homepage, `/auth`, and `/dashboard` on the final HTTPS domain.
- Register/sign in with both email and Google, save a profile and links, upload an avatar, and reload.
- Publish a profile and verify its shared URL, QR code, views, clicks, protected links, and subscription consent.
- Check logged-out requests cannot read or change owner data.
- Complete the integration and legal/operator checklist in [DEPLOYMENT.md](DEPLOYMENT.md).

The website requires a Next.js server for API routes and public profile rendering. GitHub Pages or a static upload to a domain registry cannot run this application. Firebase integration remains unavailable until valid configuration is supplied. This web repository does not include the separately delivered Android project or APK.

References: [Vercel custom domains](https://vercel.com/docs/domains/set-up-custom-domain), [runs-on.dev quickstart](https://runs-on.dev/docs/quickstart), [record reference](https://runs-on.dev/docs/records).
