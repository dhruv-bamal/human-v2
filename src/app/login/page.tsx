import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { ArrowUpRight, LockKeyhole } from "lucide-react";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ access?: string }>;
}) {
  const { access } = await searchParams;
  return (
    <main className="login-page">
      <section className="login-story">
        <Link className="wordmark" href="/">
          together<span>/ thirty</span>
        </Link>
        <div>
          <span className="eyebrow">A little stronger. Every day.</span>
          <h1>
            Two journeys.
            <br />
            One shared
            <br />
            <em>commitment.</em>
          </h1>
          <p>
            Your training, meals and small wins.
            <br />
            All in one private space.
          </p>
        </div>
        <div className="login-bottom">
          <span>30 days. At your own pace.</span>
          <ArrowUpRight size={28} />
        </div>
        <div className="journal-lines" aria-hidden="true">
          {Array.from({ length: 30 }, (_, i) => (
            <span key={i} />
          ))}
        </div>
      </section>
      <section className="login-side">
        <div className="login-box">
          <div className="small-icon">
            <LockKeyhole size={22} />
          </div>
          <span className="eyebrow">DHRUV & ANNANYA</span>
          <h2>Welcome back.</h2>
          <p className="muted">Make a little time for yourself today.</p>
          {access && (
            <p className="notice">
              This account has not been linked to either tracker.
            </p>
          )}
          <LoginForm />
        </div>
        <p className="login-footer">Consistency, with room to be human.</p>
      </section>
    </main>
  );
}
