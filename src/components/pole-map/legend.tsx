import { countPoles, type Pole } from '@/lib/pole-map/model';

export function PoleLegend({ poles }: { poles: readonly Pole[] }) {
  const counts = countPoles(poles);
  return (
    <ul className="pole-legend" aria-label="Map legend">
      <li><span className="pole-glyph pole-glyph--matches_scan" aria-hidden="true" />Matches scan · {counts.matches_scan}</li>
      <li><span className="pole-glyph pole-glyph--top_near_ground" aria-hidden="true" />Under review: top near ground · {counts.top_near_ground}</li>
      <li><span className="pole-glyph pole-glyph--top_above_pole_range" aria-hidden="true" />Under review: above pole height · {counts.top_above_pole_range}</li>
    </ul>
  );
}
