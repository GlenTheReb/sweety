import { useEffect, useRef, useState } from "react";
import { api, SLOTS } from "../lib.js";
export default function ReadingForm({
  reading,
  date,
  maxDate,
  onSave,
  onCancel,
}) {
  const dialog = useRef(null);
  useEffect(() => {
    dialog.current.showModal();
  }, []);
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
