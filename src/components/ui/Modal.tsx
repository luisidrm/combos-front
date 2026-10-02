'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  footer?: ReactNode;
  children: ReactNode;
}

/** A centered glass dialog on wide screens, a bottom sheet on phones (design: Modal / Sheet). Native <dialog>. */
export function Modal({ open, onClose, title, closeLabel, footer, children }: ModalProps) {
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
      className="fc-modal"
      aria-labelledby="fc-modal-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="fc-modal__box">
        <div className="fc-modal__head">
          <div id="fc-modal-title" className="fc-modal__title">{title}</div>
          <IconButton icon={X} label={closeLabel} variant="fill" size={32} onClick={onClose} />
        </div>
        <div className="fc-modal__body">{open ? children : null}</div>
        {footer && <div className="fc-modal__foot">{footer}</div>}
      </div>
    </dialog>
  );
}
