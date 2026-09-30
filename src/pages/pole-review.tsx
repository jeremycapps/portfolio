import { useCallback, useRef, useState } from 'react';
import { SiteHeader } from '@/components/site-header';
import { PoleMap } from '@/components/pole-map/map';
import { PoleLegend } from '@/components/pole-map/legend';
import { PoleDetail } from '@/components/pole-map/detail-sheet';
import { ReviewList } from '@/components/pole-map/review-list';
import { countPoles, formatSnapshotDate, poles, reviewPoles, source, type Pole, type PoleFilter } from '@/lib/pole-map/model';
import './pole-review.css';

const counts = countPoles(poles);
const review = reviewPoles(poles);
const filters = [['all', 'All'], ['matches_scan', 'Matches scan'], ['review', 'Under review']] as const;

export default function PoleReviewPage() {
  const [filter, setFilter] = useState<PoleFilter>('all');
  const [selected, setSelected] = useState<Pole | null>(null);
  const mapArea = useRef<HTMLDivElement>(null);
  const selectMarker = useCallback((pole: Pole) => setSelected(pole), []);
  const selectRow = (pole: Pole) => {
    if (filter === 'matches_scan') setFilter('review');
    setSelected(pole);
    mapArea.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  };

  return (
    <main className="app-shell pole-page">
      <SiteHeader />
      <div className="pole-wrap">
        <header className="pole-header">
          <h1>{counts.all} telecom poles, checked against a LiDAR scan</h1>
          <p>{counts.matches_scan} match the scan · {counts.review} under review</p>        </header>
        <div className="pole-filters" role="group" aria-label="Filter poles">
          {filters.map(([value, label]) => <button type="button" key={value}
            aria-pressed={filter === value} onClick={() => { setFilter(value); setSelected(null); }}>
            {label} ({counts[value]})
          </button>)}
        </div>
        <div className="pole-map-layout" ref={mapArea}>
          <div className="pole-map-column">
            <PoleMap filter={filter} selected={selected} onSelect={selectMarker} />
            <PoleLegend poles={poles} />
          </div>
          <PoleDetail pole={selected} onClose={() => setSelected(null)} />
        </div>
        <ReviewList poles={review} onSelect={selectRow} />
        <section className="pole-method" aria-labelledby="pole-method-title">
          <h2 id="pole-method-title">How it works</h2>
          <p>Each pole’s reservation record is matched to the LiDAR points at its base and top.</p>
          <p>Heights outside a normal pole range are flagged for a person to review, and the records are kept.</p>
          <p>Equipment mounted on buildings can produce tall readings, which is why those readings are flagged rather than rejected.</p>
        </section>
        <footer className="pole-data-note">
          <p>GIS: {source.gis}. LiDAR: {source.lidar}.</p>
          <p>Snapshot: <time dateTime={source.generated_at}>{formatSnapshotDate(source.generated_at)}</time>.</p>
        </footer>
      </div>
    </main>
  );
}
