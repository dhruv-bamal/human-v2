"use client";
import { useActionState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { login } from "@/app/actions";
export function LoginForm() {
  const [state, action, pending] = useActionState(login, {
    ok: false,
    message: "",
  });
  return (
    <form action={action} className="login-form">
      <label>
        Email address
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="Your account email"
        />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Your password"
        />
      </label>
      <p role="status" className="form-status">
        {state.message}
      </p>
      <button className="button primary" disabled={pending}>
        {pending ? "Signing in…" : "Enter your space"}
        <ArrowRight size={18} />
      </button>
      <p className="quiet">
        <LockKeyhole size={14} /> Invite-only. Just the two of you.
      </p>
    </form>
  );
}
