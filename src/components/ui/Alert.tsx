'use client';

import { useEffect, useRef } from 'react';

interface AlertProps {
  open: boolean;
  title: string;
  message?: string;
  cancelLabel: string;
  confirmLabel: string;
  /** Red confirm button, for actions that remove something. */
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Centered confirm dialog (design: Alert). Built on <dialog> so focus trapping and Esc come from the browser. */
export function Alert({ open, title, message, cancelLabel, confirmLabel, destructive, onConfirm, onClose }: AlertProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="fc-alert"
      aria-labelledby="fc-alert-title"
      onClose={onClose}
      // A click on the backdrop lands on the <dialog> element itself, not on the box inside it.
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="fc-alert__box">
        <div id="fc-alert-title" className="fc-alert__title">{title}</div>
        {message && <div className="fc-alert__msg">{message}</div>}
        <div className="fc-alert__actions">
          <button type="button" className="fc-btn fc-btn--tinted" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`fc-btn ${destructive ? 'fc-btn--danger' : 'fc-btn--primary'}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
