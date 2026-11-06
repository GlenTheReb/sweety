import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const SLOTS = [
  "Morning (fasting)",
  "After breakfast",
  "After lunch",
  "After dinner",
];
const SYMBOLS = ["☀", "◒", "◑", "☾"];
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const label = (date) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
  });
  const body = response.status === 204 ? {} : await response.json();
  if (!response.ok)
    throw new Error(body.error || "Unable to complete the request.");
  return body;
}
function Brand() {
  return (
    <a className="brand" href="/" aria-label="Sweety home">
      <span className="brand-mark">s</span>sweety
      <span className="brand-dot">.</span>
    </a>
  );
}
function Auth({ onLogin }) {
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
function ReadingForm({ reading, date, maxDate, onSave, onCancel }) {
  const dialog = useRef(null);
  useEffect(() => { dialog.current.showModal(); }, []);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setError("");
    const body = Object.fromEntries(new FormData(event.currentTarget));
    if (!body.value) return setError("Please enter a glucose value.");
    if (
      !/^\d+$/.test(body.value) ||
      Number(body.value) < 40 ||
      Number(body.value) > 600
    )
      return setError("Value must be a whole number between 40 and 600 mg/dL.");
    if (body.date > maxDate) return setError("Date cannot be in the future.");
    setBusy(true);
    try {
      await api(`/readings${reading?.id ? `/${reading.id}` : ""}`, {
        method: reading?.id ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      onSave(body.date);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
      <dialog
        ref={dialog}
        onCancel={onCancel}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-title"
      >
        <div className="section-heading">
          <h2 id="form-title">
            {reading?.id ? "Edit reading" : "Add a reading"}
          </h2>
          <button
            className="icon-button"
            aria-label="Close form"
            onClick={onCancel}
          >
            ×
          </button>
        </div>
        <p className="muted">A small check-in for your daily record.</p>
        <form noValidate onSubmit={submit}>
          <label>
            Date
            <input
              autoFocus
              type="date"
              name="date"
              required
              max={maxDate}
              defaultValue={reading?.date || date}
            />
          </label>
          <label>
            Time slot
            <select name="slot" defaultValue={reading?.slot || SLOTS[0]}>
              {SLOTS.map((slot) => (
                <option key={slot}>{slot}</option>
              ))}
            </select>
          </label>
          <label>
            Glucose value <span className="muted">(mg/dL)</span>
            <input
              name="value"
              type="number"
              inputMode="numeric"
              min="40"
              max="600"
              step="1"
              defaultValue={reading?.value ?? ""}
              placeholder="e.g. 110"
            />
          </label>
          <p className="hint">Enter a whole number from 40 to 600.</p>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="form-actions">
            <button type="button" className="secondary" onClick={onCancel}>
              Cancel
            </button>
            <button className="primary" disabled={busy}>
              {busy ? "Saving…" : "Save reading"}
            </button>
          </div>
        </form>
      </dialog>
  );
}
function Dashboard({ user, onLogout }) {
  const [date, setDate] = useState(today);
  const [data, setData] = useState(null);
  const [report, setReport] = useState("daily");
  const [editing, setEditing] = useState(null);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api(`/reports?date=${date}`, { signal: controller.signal })
      .then(setData)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [date, revision]);
  async function remove(reading) {
    if (
      !window.confirm(
        `Delete the ${reading.slot} reading for ${label(reading.date)}?`,
      )
    )
      return;
    try {
      await api(`/readings/${reading.id}`, { method: "DELETE" });
      setNotice("Reading deleted.");
      setRevision((v) => v + 1);
    } catch (err) {
      setError(err.message);
    }
  }
  const readings = !loading ? data?.daily.readings || [] : [];
  const stats = !loading ? data?.[report] : null;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <div className="side-caption">YOUR SPACE</div>
        <a className="nav-active" href="#journal">
          <span>▦</span> Glucose journal
        </a>
        <div className="side-note">
          <span className="note-spark">✳</span>
          <h3>
            Small steps,
            <br />a clearer picture.
          </h3>
          <p>Your readings come together here, one day at a time.</p>
        </div>
        <div className="profile">
          <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
          <div>
            <strong>{user.name}</strong>
            <small>Personal journal</small>
          </div>
          <button aria-label="Log out" title="Log out" onClick={onLogout}>
            ↪
          </button>
        </div>
      </aside>
      <main className="workspace" id="journal">
        <header className="topbar">
          <span>
            My health / <strong>Glucose journal</strong>
          </span>
          <span className="private-note">◈ &nbsp; Your private space</span>
        </header>
        <div className="content">
          <section className="page-heading">
            <div>
              <p className="tiny">LET’S TAKE IT ONE DAY AT A TIME</p>
              <h1>A clearer view of your day.</h1>
              <p className="muted">
                Record your readings. Get to know your patterns.
              </p>
            </div>
            <button className="primary" onClick={() => setEditing({})}>
              ＋ &nbsp; Add reading
            </button>
          </section>
          <div className="date-bar">
            <div>
              <span className="calendar-icon">▦</span>
              <div>
                <strong>{label(date)}</strong>
                <small>
                  {date === today() ? "Today" : "Your selected day"} · India
                  Standard Time
                </small>
              </div>
            </div>
            <label className="date-picker">
              Choose date
              <input
                aria-label="Choose date"
                type="date"
                value={date}
                max={today()}
                onChange={(e) => {
                  if (e.target.value) {
                    setDate(e.target.value);
                    setNotice("");
                  }
                }}
              />
            </label>
          </div>
          {notice && (
            <p role="status" className="notice">
              ✓ {notice}
            </p>
          )}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <section className="daily-section">
            <div className="section-heading">
              <h2>Daily check-ins</h2>
              <span className="completion">
                {readings.length} of 4 recorded
              </span>
            </div>
            <div className="slot-grid">
              {SLOTS.map((slot, i) => {
                const reading = readings.find((r) => r.slot === slot);
                return (
                  <article
                    key={slot}
                    className={`slot-card ${reading ? "recorded" : ""}`}
                  >
                    <div className="slot-top">
                      <span className="slot-symbol">{SYMBOLS[i]}</span>
                      <span className="slot-number">0{i + 1}</span>
                    </div>
                    <h3>{slot}</h3>
                    {loading ? (
                      <p className="slot-empty">Loading…</p>
                    ) : reading ? (
                      <>
                        <p className="reading-value">
                          {reading.value}
                          <span>mg/dL</span>
                        </p>
                        <div className="reading-actions">
                          <button onClick={() => setEditing(reading)}>
                            Edit reading
                          </button>
                          <button
                            aria-label={`Delete ${slot}`}
                            onClick={() => remove(reading)}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="slot-empty">No reading yet</p>
                        <button
                          className="add-slot"
                          onClick={() => setEditing({ slot })}
                        >
                          ＋ Add reading
                        </button>
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
          <section className="report-panel">
            <div className="section-heading">
              <div>
                <h2>Your readings, at a glance</h2>
                <p className="muted">
                  A simple summary of the numbers you’ve recorded.
                </p>
              </div>
              <span className="report-symbol">↗</span>
            </div>
            <div
              className="report-tabs"
              role="tablist"
              aria-label="Report period"
            >
              {[
                ["daily", "Daily"],
                ["monthToDate", "Month to date"],
                ["monthly", "Previous month"],
              ].map(([key, title]) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={report === key}
                  onClick={() => setReport(key)}
                >
                  {title}
                </button>
              ))}
            </div>
            <div className="report-range">
              {stats
                ? `${label(stats.from)}${stats.from !== stats.to ? ` – ${label(stats.to)}` : ""}`
                : "Loading summary…"}
            </div>
            {stats?.count ? (
              <div className="stats-grid">
                {[
                  ["Average", stats.average.toFixed(1), "mg/dL"],
                  ["Highest", stats.highest, "mg/dL"],
                  ["Lowest", stats.lowest, "mg/dL"],
                  ["Readings", stats.count, "recorded"],
                ].map(([title, value, unit]) => (
                  <div key={title}>
                    <span>{title}</span>
                    <strong>
                      {value}
                      <small>{unit}</small>
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-report">
                <span>◌</span>
                <div>
                  <strong>
                    {loading
                      ? "Gathering your readings…"
                      : "A fresh page in your journal"}
                  </strong>
                  <p>
                    {loading
                      ? "Your summary will be ready in a moment."
                      : "No readings in this period. Add a reading to start your summary."}
                  </p>
                </div>
              </div>
            )}
          </section>
          <footer>
            Made for your everyday moments.
            <span>Sweety is a journal, not medical advice.</span>
          </footer>
        </div>
      </main>
      {editing && (
        <ReadingForm
          key={editing.id || editing.slot || "new"}
          reading={editing}
          date={date}
          maxDate={today()}
          onCancel={() => setEditing(null)}
          onSave={(savedDate) => {
            setEditing(null);
            setDate(savedDate);
            setRevision((v) => v + 1);
            setNotice("Reading saved. Your summary is up to date.");
          }}
        />
      )}
    </div>
  );
}
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api("/auth/me")
      .then((body) => setUser(body.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="boot">Opening your journal…</div>;
  return user ? (
    <Dashboard
      user={user}
      onLogout={async () => {
        try {
          await api("/auth/logout", { method: "POST" });
          setUser(null);
        } catch (err) {
          window.alert(err.message);
        }
      }}
    />
  ) : (
    <Auth onLogin={setUser} />
  );
}
createRoot(document.getElementById("root")).render(<App />);
