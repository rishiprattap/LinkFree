"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="center-page">
      <h1>Something went wrong.</h1>
      <p>Please try again. Your saved data is safe.</p>
      <button className="btn primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
