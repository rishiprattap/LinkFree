import Link from "next/link";
export default function NotFound() {
  return (
    <main className="center-page">
      <span className="eyebrow">404 · A LITTLE LOST?</span>
      <h1>
        This page hasn’t
        <br />
        found its home.
      </h1>
      <p>The profile may be private, renamed, or no longer available.</p>
      <Link href="/" className="btn primary">
        Back to LinkFree
      </Link>
    </main>
  );
}
