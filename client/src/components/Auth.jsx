import { useState } from "react";
import Brand from "./Brand.jsx";
import { api } from "../lib.js";
export default function Auth({ onLogin }) {
  const [register, setRegister] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const body = Object.fromEntries(new FormData(event.currentTarget));
      const result = await api(`/auth/${register ? "register" : "login"}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      onLogin(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth">
      <section className="auth-story">
        <Brand />
        <div>
          <span className="tiny">A LITTLE HABIT. A CLEARER PICTURE.</span>
          <h1>
            Your glucose journal,
            <br />
            <em>made simple.</em>
          </h1>
          <p>Four moments a day. One calm place to keep track of them.</p>
          <div className="auth-art" aria-hidden="true">
            <span>
              94<small>mg/dL</small>
            </span>
            <svg viewBox="0 0 300 100">
              <path d="M0 65 Q30 75 60 45 T120 40 T180 50 T240 25 T300 30" />
            </svg>
          </div>
        </div>
        <p className="muted">A personal record, at your pace.</p>
      </section>
      <section className="auth-form">
        <div>
          <span className="tiny">WELCOME TO SWEETY</span>
          <h2>{register ? "Start your journal" : "Good to see you"}</h2>
          <p className="muted">
            {register
              ? "Create your account to record your first reading."
              : "Log in to pick up where you left off."}
          </p>
          <form onSubmit={submit}>
            {register && (
              <label>
                Name
                <input
                  name="name"
                  autoComplete="name"
                  required
                  maxLength="100"
                />
              </label>
            )}
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength="254"
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete={register ? "new-password" : "current-password"}
                required
                minLength="8"
              />
            </label>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <button className="primary" disabled={busy}>
              {busy ? "Please wait…" : register ? "Create account" : "Log in"}{" "}
              <span>↗</span>
            </button>
          </form>
          <p className="switch">
            {register ? "Already have an account?" : "New to Sweety?"}{" "}
            <button
              onClick={() => {
                setRegister(!register);
                setError("");
              }}
            >
              {register ? "Log in" : "Create an account"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
