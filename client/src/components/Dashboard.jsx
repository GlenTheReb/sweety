import Icon from "./Icon.jsx";
import { useEffect, useState } from "react";
import Brand from "./Brand.jsx";
import ReadingForm from "./ReadingForm.jsx";
import TrendChart from "./TrendChart.jsx";
import DeleteReadingDialog from "./DeleteReadingDialog.jsx";
import { api, SLOTS, SYMBOLS, today, label, shiftDay } from "../lib.js";
const REPORTS = [
  ["daily", "Daily"],
  ["monthToDate", "Month to date"],
  ["monthly", "Previous month"],
];
export default function Dashboard({ user, onLogout, onSessionExpired }) {
  const [date, setDate] = useState(today);
  const [data, setData] = useState(null);
  const [report, setReport] = useState("daily");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  async function logOut() {
    setLoggingOut(true);
    setActionError("");
    try {
      await onLogout();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setLoggingOut(false);
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setData(null);
    setError("");
    api(`/reports?date=${date}`, { signal: controller.signal })
      .then(setData)
      .catch((err) => {
        if (err.status === 401) onSessionExpired?.();
        else if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [date, revision, onSessionExpired]);
  function chooseDate(value) {
    setDate(value);
    setNotice("");
  }
  const readings = !loading ? data?.daily.readings || [] : [];
  const stats = !loading ? data?.[report] : null;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#journal">
        Skip to journal
      </a>
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
          <button
            aria-label="Log out"
            title="Log out"
            onClick={logOut}
            disabled={loggingOut}
          >
            {<Icon name="logout" />}
          </button>
        </div>
      </aside>
      <main className="workspace" id="journal" tabIndex="-1">
        <header className="topbar">
          <span>
            My health / <strong>Glucose journal</strong>
          </span>
          <span className="private-note">◈ &nbsp; Your private space</span>
          <button
            className="mobile-logout secondary"
            onClick={logOut}
            disabled={loggingOut}
          >
            {loggingOut ? "Logging out…" : "Log out"}
          </button>
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
              {<Icon name="add" />} Add reading
            </button>
          </section>
          <div className="date-bar">
            <div>
              <span className="calendar-icon">
                <Icon name="calendar" />
              </span>
              <div>
                <strong>{label(date)}</strong>
                <small>
                  {date === today() ? "Today" : "Your selected day"} · India
                  Standard Time
                </small>
              </div>
            </div>
            <div className="date-controls">
              <div className="day-navigation" aria-label="Day navigation">
                <button
                  className="secondary"
                  aria-label="Previous day"
                  onClick={() => chooseDate(shiftDay(date, -1))}
                >
                  <Icon name="previous" />
                </button>
                <button
                  className="secondary"
                  disabled={date === today()}
                  onClick={() => chooseDate(today())}
                >
                  Today
                </button>
                <button
                  className="secondary"
                  aria-label="Next day"
                  disabled={date >= today()}
                  onClick={() => chooseDate(shiftDay(date, 1))}
                >
                  <Icon name="next" />
                </button>
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
                      chooseDate(e.target.value);
                    }
                  }}
                />
              </label>
            </div>
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
          {actionError && (
            <p role="alert" className="error">
              {actionError}
            </p>
          )}
          <section className="daily-section">
            <div className="section-heading">
              <h2>Daily check-ins</h2>
              <span className="completion">
                {loading
                  ? "Loading…"
                  : error
                    ? "Unavailable"
                    : `${readings.length} of 4 recorded`}
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
                    ) : error ? (
                      <p className="slot-empty">Unavailable</p>
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
                            onClick={() => setDeleting(reading)}
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
              <span className="report-symbol">
                <Icon name="arrow" />
              </span>
            </div>
            <div
              className="report-tabs"
              role="tablist"
              aria-label="Report period"
            >
              {REPORTS.map(([key, title], index) => (
                <button
                  key={key}
                  role="tab"
                  id={`tab-${key}`}
                  aria-controls="report-content"
                  tabIndex={report === key ? 0 : -1}
                  aria-selected={report === key}
                  onClick={() => setReport(key)}
                  onKeyDown={(event) => {
                    const next =
                      event.key === "ArrowRight"
                        ? (index + 1) % 3
                        : event.key === "ArrowLeft"
                          ? (index + 2) % 3
                          : event.key === "Home"
                            ? 0
                            : event.key === "End"
                              ? 2
                              : null;
                    if (next == null) return;
                    event.preventDefault();
                    setReport(REPORTS[next][0]);
                    event.currentTarget.parentElement
                      .querySelectorAll('[role="tab"]')
                      [next].focus();
                  }}
                >
                  {title}
                </button>
              ))}
            </div>
            <div
              id="report-content"
              role="tabpanel"
              aria-labelledby={`tab-${report}`}
              tabIndex="0"
              aria-busy={loading}
            >
              <div className="report-range">
                {stats
                  ? `${label(stats.from)}${stats.from !== stats.to ? ` – ${label(stats.to)}` : ""}`
                  : error
                    ? "Summary unavailable"
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
              ) : error ? (
                <div className="empty-report report-error">
                  <div>
                    <strong>We couldn’t load your readings</strong>
                    <p>
                      Your saved data has not changed. Try again to refresh this
                      day.
                    </p>
                    <button
                      className="secondary"
                      onClick={() => setRevision((v) => v + 1)}
                    >
                      Try again
                    </button>
                  </div>
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
              {report !== "daily" && stats?.count > 0 && (
                <TrendChart
                  key={`${report}-${date}-${revision}`}
                  readings={stats.readings}
                />
              )}
            </div>
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
          onSessionExpired={onSessionExpired}
          onSave={(savedDate) => {
            setEditing(null);
            setDate(savedDate);
            setRevision((v) => v + 1);
            setNotice("Reading saved.");
          }}
        />
      )}
      {deleting && (
        <DeleteReadingDialog
          reading={deleting}
          onCancel={() => setDeleting(null)}
          onSessionExpired={onSessionExpired}
          onDeleted={() => {
            setDeleting(null);
            setNotice("Reading deleted.");
            setRevision((v) => v + 1);
          }}
        />
      )}
    </div>
  );
}
