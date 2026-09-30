import { describe, expect, it } from 'vitest';
import { countPoles, filterPoles, formatHeight, formatOffset, formatPoint, formatSnapshotDate, poles, reviewPoles, source } from './model';

describe('pole snapshot selectors', () => {
  it('preserves the observed counts and reasons', () => {
    expect(countPoles(poles)).toEqual({ all: 106, matches_scan: 72, review: 34, top_near_ground: 29, top_above_pole_range: 5 });
    expect(reviewPoles(poles).every((pole) => pole.review_reason !== null)).toBe(true);
    expect(filterPoles(poles, 'matches_scan').every((pole) => pole.review_reason === null)).toBe(true);
  });

  it('keeps all coordinates in the Lower Manhattan bounds', () => {
    for (const pole of poles) {
      expect(pole.lat).toBeGreaterThanOrEqual(40.702);
      expect(pole.lat).toBeLessThanOrEqual(40.709);
      expect(pole.lon).toBeGreaterThanOrEqual(-74.015);
      expect(pole.lon).toBeLessThanOrEqual(-74.006);
    }
  });

  it('filters the map without losing or changing source records', () => {
    expect(filterPoles(poles, 'all')).toBe(poles);
    for (const [filter, count] of [['matches_scan', 72], ['review', 34]] as const) {
      const subset = filterPoles(poles, filter);
      expect(subset).toHaveLength(count);
      expect(subset.every((pole) => pole.status === filter && poles.includes(pole))).toBe(true);
    }
    const originalIds = poles.map((pole) => pole.id);
    reviewPoles(poles);
    expect(poles.map((pole) => pole.id)).toEqual(originalIds);
  });

  it('rounds only for display and uses stable source formatting', () => {
    expect(formatHeight(17.060000000000002)).toBe('17.1 ft');
    expect(formatOffset(0.5293711843250074)).toBe('0.53 m');
    expect(formatPoint(7395528)).toBe('NYC LiDAR tile 980195, point #7,395,528');
    expect(formatSnapshotDate(source.generated_at)).toBe('September 30, 2026');
  });
});
