'use client';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="system-page">
      <h1>Something went wrong.</h1>
      <p>Please try again.</p>
      <button className="btn" type="button" onClick={reset}>Try again</button>
    </main>
  );
}
