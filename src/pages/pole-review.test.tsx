import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import PoleReviewPage from './pole-review';
import { PoleDetail } from '@/components/pole-map/detail-sheet';
import { poles, reviewPoles } from '@/lib/pole-map/model';
import { metadataForPath } from '@/lib/site-metadata';

describe('pole review prerender', () => {
  it('renders the counts and all review rows without a browser or Leaflet', () => {
    const html = renderToStaticMarkup(<PoleReviewPage />);
    expect(html).toContain('106 telecom poles, checked against a LiDAR scan');
    expect(html).toContain('72 match the scan · 34 under review');
    expect(html.match(/aria-label="Review pole /g)).toHaveLength(34);
    expect(html).toContain('Under review (34)');
    expect(html).not.toMatch(/Neara|Sand|UTID|Timpos|Corus|Libera|Facia|Confirmed/i);
    expect(html).not.toContain('github.com');
  });

  it('renders the same detail for any review row, including its source points', () => {
    for (const pole of reviewPoles(poles)) {
      const html = renderToStaticMarkup(<PoleDetail pole={pole} onClose={() => {}} />);
      expect(html).toContain(`Pole ${pole.id}`);
      expect(html).toContain(pole.source_points.top.toLocaleString('en-US'));
      expect(html).toContain('The record is kept for a person to check.');
    }
  });

  it('is unlisted and explicitly noindex', () => {
    expect(metadataForPath('/pole-review')).toMatchObject({ title: 'Pole Review Map', unlisted: true, noindex: true });
  });
});
