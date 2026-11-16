import { useEffect, useRef } from "react";

export default function ConfirmDialog({ title, children, onCancel, onConfirm, confirmLabel = "Confirm", busy = false, danger = false }) {
  const ref = useRef(null);
  const cancelRef = useRef(null);
  useEffect(() => {
    const trigger = document.activeElement;
    const dialog = ref.current;
    if (!dialog.open) dialog.showModal();
    cancelRef.current?.focus();
    return () => {
      if (dialog.open) dialog.close();
      trigger?.focus?.();
    };
  }, []);
  return <dialog ref={ref} className="admin-confirm" aria-labelledby="admin-confirm-title" onCancel={(event) => { event.preventDefault(); if (!busy) onCancel(); }}>
    <h3 className="heading-5" id="admin-confirm-title">{title}</h3>
    <div className="body-3">{children}</div>
    <div className="admin-confirm__actions">
      <button ref={cancelRef} type="button" className="btn btn--line" onClick={onCancel} disabled={busy}>Cancel</button>
      <button type="button" className={`btn ${danger ? "admin-delete-btn" : "btn--primary"}`} onClick={onConfirm} disabled={busy}>{busy ? "Working…" : confirmLabel}</button>
    </div>
  </dialog>;
}
