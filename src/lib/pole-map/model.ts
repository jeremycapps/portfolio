import snapshot from './snapshot.json';

export type ReviewReason = 'top_near_ground' | 'top_above_pole_range';
export type PoleStatus = 'matches_scan' | 'review';
export type PoleFilter = 'all' | PoleStatus;
export type Pole = Omit<(typeof snapshot.poles)[number], 'status' | 'review_reason'> & (
  | { status: 'matches_scan'; review_reason: null }
  | { status: 'review'; review_reason: ReviewReason }
);

export const poles = snapshot.poles as readonly Pole[];
export const source = snapshot.source;
export const reasonLabels: Record<ReviewReason, string> = {
  top_near_ground: 'Top near ground',
  top_above_pole_range: 'Above pole height',
};
export const reasonDescriptions: Record<ReviewReason, string> = {
  top_near_ground: 'The top point sits almost at street level, so the scan likely missed the top of the pole.',
  top_above_pole_range: 'The top reading is higher than a normal pole and may be equipment mounted on a building.',
};

export function filterPoles(records: readonly Pole[], filter: PoleFilter): readonly Pole[] {
  return filter === 'all' ? records : records.filter((pole) => pole.status === filter);
}

export function countPoles(records: readonly Pole[]) {
  return {
    all: records.length,
    matches_scan: filterPoles(records, 'matches_scan').length,
    review: filterPoles(records, 'review').length,
    top_near_ground: records.filter((pole) => pole.review_reason === 'top_near_ground').length,
    top_above_pole_range: records.filter((pole) => pole.review_reason === 'top_above_pole_range').length,
  };
}

export function reviewPoles(records: readonly Pole[]): readonly Pole[] {
  return [...filterPoles(records, 'review')].sort((a, b) =>
    (a.review_reason ?? '').localeCompare(b.review_reason ?? '') || a.height_ft - b.height_ft,
  );
}

export function statusLabel(pole: Pole): string {
  return pole.status === 'matches_scan' ? 'Matches scan' : 'Under review';
}

export function formatHeight(value: number): string {
  return `${value.toFixed(1)} ft`;
}

export function formatOffset(value: number): string {
  return `${value.toFixed(2)} m`;
}

export function formatPoint(value: number): string {
  return `NYC LiDAR tile 980195, point #${value.toLocaleString('en-US')}`;
}

export function formatSnapshotDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  }).format(new Date(value));
}
