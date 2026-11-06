import { useEffect, useRef, useState } from "react";
import { api, label } from "../lib.js";

export default function DeleteReadingDialog({
  reading,
  onCancel,
  onDeleted,
  onSessionExpired,
}) {
  const dialog = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    dialog.current.showModal();
  }, []);
  async function remove() {
    setBusy(true);
    setError("");
    try {
      await api(`/readings/${reading.id}`, { method: "DELETE" });
      onDeleted();
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
      className="modal"
      aria-labelledby="delete-title"
      aria-describedby="delete-description"
      onCancel={(event) => {
        if (busy) event.preventDefault();
        else onCancel();
      }}
    >
      <h2 id="delete-title">Delete this reading?</h2>
      <p id="delete-description" className="muted">
        This removes the {reading.slot} entry for {label(reading.date)} from
        your journal and reports. You can add it again later.
      </p>
      <div className="delete-preview">
        <span>{reading.slot}</span>
        <strong>
          {reading.value} <small>mg/dL</small>
        </strong>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button
          className="secondary"
          autoFocus
          disabled={busy}
          onClick={onCancel}
        >
          Keep reading
        </button>
        <button className="danger" disabled={busy} onClick={remove}>
          {busy ? "Deleting…" : "Delete reading"}
        </button>
      </div>
    </dialog>
  );
}
