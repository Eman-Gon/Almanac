"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

export function DetailsDrawer({
  open,
  title,
  children,
  onClose,
  className = "",
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={`details-drawer ${className}`}
      aria-label={title}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClose={() => { if (open) onClose(); }}
    >
      <div className="details-drawer-inner">
        <div className="details-drawer-header">
          <h2>{title}</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label={`Close ${title}`}><X size={18} aria-hidden="true" /></button>
        </div>
        <div className="details-drawer-body">{children}</div>
      </div>
    </dialog>
  );
}
