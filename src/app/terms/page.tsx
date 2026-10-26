import Link from "next/link";
export default function Terms() {
  return (
    <main className="document">
      <Link href="/">← LinkFree</Link>
      <h1>A space built on respect.</h1>
      <p>
        You are responsible for content and destinations you publish. Do not use
        this service for fraud, phishing, malware, illegal material or
        violations of others’ rights. Do not collect email addresses without
        consent.
      </p>
      <p>
        This open-source application is provided under the MIT license, without
        warranty. The operator of each installation determines service
        availability and is responsible for adding their legal identity, contact
        information and any required local terms before launch.
      </p>
      <p>
        LinkFree is an independent project and is not affiliated with Linktree.
        All customization features in this codebase are available without a
        subscription. Firebase and hosting providers may charge usage fees.
      </p>
    </main>
  );
}
