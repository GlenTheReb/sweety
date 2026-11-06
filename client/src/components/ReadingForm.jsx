import { useEffect, useRef, useState } from "react";
import { api, SLOTS } from "../lib.js";
export default function ReadingForm({
  reading,
  date,
  maxDate,
  onSave,
  onCancel,
  onSessionExpired,
}) {
  const dialog = useRef(null);
  useEffect(() => {
    dialog.current.showModal();
    if (window.matchMedia?.("(pointer: fine)").matches)
      dialog.current.querySelector('[name="value"]').focus();
  }, []);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorField, setErrorField] = useState("");
  function invalid(message, field, form) {
    setError(message);
    setErrorField(field);
    form.elements.namedItem(field)?.focus();
  }
  async function submit(event) {
    event.preventDefault();
    setError("");
    setErrorField("");
    const body = Object.fromEntries(new FormData(event.currentTarget));
    if (!body.date)
      return invalid("Please choose a date.", "date", event.currentTarget);
    if (!body.value)
      return invalid(
        "Please enter a glucose value.",
        "value",
        event.currentTarget,
      );
    if (
      !/^\d+$/.test(body.value) ||
      Number(body.value) < 40 ||
      Number(body.value) > 600
    )
      return invalid(
        "Value must be a whole number between 40 and 600 mg/dL.",
        "value",
        event.currentTarget,
      );
    if (body.date > maxDate)
      return invalid(
        "Date cannot be in the future.",
        "date",
        event.currentTarget,
      );
    setBusy(true);
    try {
      await api(`/readings${reading?.id ? `/${reading.id}` : ""}`, {
        method: reading?.id ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      onSave(body.date);
    } catch (err) {
      if (err.status === 401) onSessionExpired?.();
      else setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      onCancel={(event) => {
        if (busy) event.preventDefault();
        else onCancel();
      }}
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
          disabled={busy}
        >
          ×
        </button>
      </div>
      <p className="muted">A small check-in for your daily record.</p>
      <form noValidate onSubmit={submit}>
        <fieldset disabled={busy}>
          <label>
            Date
            <input
              type="date"
              name="date"
              required
              max={maxDate}
              defaultValue={reading?.date || date}
              aria-invalid={errorField === "date"}
              aria-describedby={
                errorField === "date" ? "reading-error" : undefined
              }
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
              aria-invalid={errorField === "value"}
              aria-describedby={
                errorField === "value"
                  ? "value-hint reading-error"
                  : "value-hint"
              }
            />
          </label>
          <p className="hint" id="value-hint">
            Enter a whole number from 40 to 600.
          </p>
        </fieldset>
        {error && (
          <p role="alert" id="reading-error" className="error">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button
            type="button"
            className="secondary"
            onClick={onCancel}
            disabled={busy}
          >
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
