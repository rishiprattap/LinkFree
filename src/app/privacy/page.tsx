import Link from "next/link";
export default function Privacy() {
  return (
    <main className="document">
      <Link href="/">← LinkFree</Link>
      <h1>Privacy, in plain language.</h1>
      <p>
        This self-hosted LinkFree installation stores account information in
        Firebase Authentication and your profile, links, analytics and
        consenting subscribers in Firestore. Profile pictures are public files
        in Firebase Storage.
      </p>
      <h2>Analytics</h2>
      <p>
        Public interactions use an HMAC of the trusted proxy IP address and user
        agent to enforce request limits. Analytics use a separate date-specific
        pseudonymous identifier. Raw IP addresses are not stored. A view or
        click is counted at most once per estimated visitor, day, profile and
        link. Shared networks and browsers can make these estimates inaccurate.
        Daily unique counts are not deduplicated across days.
      </p>
      <p>
        Device category and referring hostname are stored in aggregate. Country
        is recorded only when provided by a configured trusted hosting proxy.
        This is an estimate, not precise location. Analytics event keys expire
        after 48 hours when Firestore TTL is enabled. Aggregated statistics are
        retained until the creator deletes their account.
      </p>
      <h2>Email subscriptions</h2>
      <p>
        Subscriptions require your explicit consent. The creator can export your
        email and unsubscribe link. Save the unsubscribe link shown after
        subscribing. LinkFree does not send newsletters or subscription
        confirmation emails. Creators are responsible for honoring consent and
        including an unsubscribe link in every message.
      </p>
      <h2>Your control</h2>
      <p>
        Creators can delete subscribers or their entire account from settings.
        Firebase authentication uses browser persistence until sign-out.
        Embedded YouTube and Spotify content loads only when selected and may
        then process information under those services’ privacy policies.
      </p>
      <h2>For installation operators</h2>
      <p>
        Before public launch, provide your legal identity, privacy contact,
        jurisdiction-specific notices, retention policy and provider agreements.
        Configure TTL, billing alerts, backup policy, security rules and trusted
        ingress. This page describes the application’s behavior; it is not legal
        advice.
      </p>
    </main>
  );
}
