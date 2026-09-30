import { useEffect, useRef } from 'react';
import { formatHeight, formatOffset, formatPoint, reasonDescriptions, statusLabel, type Pole } from '@/lib/pole-map/model';

export function PoleDetail({ pole, onClose }: { pole: Pole | null; onClose: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!pole) return;
    const previous = document.activeElement;
    heading.current?.focus({ preventScroll: true });
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, [pole]);

  return (
    <aside className="pole-detail" data-open={Boolean(pole)} aria-labelledby="pole-detail-title"
      onKeyDown={(event) => { if (event.key === 'Escape') onClose(); }}>
      {pole ? <>
        <button className="pole-detail-close" type="button" onClick={onClose} aria-label="Close pole detail">Close</button>
        <h2 id="pole-detail-title" ref={heading} tabIndex={-1}>Pole {pole.id}</h2>
        <p className="pole-status"><span className={`pole-glyph pole-glyph--${pole.review_reason ?? 'matches_scan'}`} aria-hidden="true" />{statusLabel(pole)}</p>
        <p>{pole.review_reason ? reasonDescriptions[pole.review_reason] : 'The scan matches the record and the height is typical for a pole.'}</p>
        {pole.status === 'review' && <p>The record is kept for a person to check.</p>}
        <h3>Record</h3>
        <dl>
          <dt>Pole ID</dt><dd>{pole.id}</dd>
          <dt>Reservation</dt><dd>{pole.reservation_status}</dd>
          <dt>Franchisee</dt><dd>{pole.franchisee}</dd>
          <dt>Street</dt><dd>{pole.on_street}</dd>
          <dt>Cross street</dt><dd>{pole.cross_street || 'Not recorded'}</dd>
        </dl>
        <h3>Scan</h3>
        <dl>
          <dt>Base height</dt><dd>{formatHeight(pole.base_z_ft)}</dd>
          <dt>Top height</dt><dd>{formatHeight(pole.top_z_ft)}</dd>
          <dt>Top − base</dt><dd>{formatHeight(pole.height_ft)}</dd>
          <dt>Horizontal offset</dt><dd>{formatOffset(pole.offset_m)} from the GIS record</dd>
          <dt>Base source</dt><dd>{formatPoint(pole.source_points.base)}</dd>
          <dt>Top source</dt><dd>{formatPoint(pole.source_points.top)}</dd>
        </dl>
      </> : <><h2 id="pole-detail-title">Select a pole</h2><p>Tap a marker or a row below.</p></>}
    </aside>
  );
}
