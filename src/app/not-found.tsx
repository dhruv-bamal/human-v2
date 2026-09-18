import Link from "next/link";
export default function NotFound() {
  return (
    <main className="loading-screen">
      <h1>This page isn’t in the plan.</h1>
      <Link className="button primary" href="/app/today">
        Back to today
      </Link>
    </main>
  );
}
