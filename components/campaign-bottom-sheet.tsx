'use client';

import { useId, type ReactNode, type RefObject } from 'react';

export default function CampaignBottomSheet({ dialogRef, title, children, centered = false, side = false, onClose }: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  title: string;
  children: ReactNode;
  centered?: boolean;
  side?: boolean;
  onClose?: () => void;
}) {
  const titleId = useId();
  return <dialog ref={dialogRef} className={`mj-sheet${side ? " mj-sheet-side" : centered ? " mj-sheet-centered" : ""}`} aria-labelledby={titleId} onClose={onClose}
    onClick={event => {
      if (event.target === event.currentTarget) event.currentTarget.close();
    }}>
    <div className="mj-sheet-content">
      <div className="mj-sheet-heading">
        <h3 id={titleId}>{title}</h3>
        <button type="button" className="btn outline" onClick={() => dialogRef.current?.close()}>Fermer</button>
      </div>
      {children}
    </div>
  </dialog>;
}
