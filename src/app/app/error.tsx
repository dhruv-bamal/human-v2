"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="loading-screen">
      <h1>Your journal needs a moment.</h1>
      <p>We couldn’t load your tracker. Your saved progress is safe.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
      <a href="/login">Return to sign in</a>
    </main>
  );
}
