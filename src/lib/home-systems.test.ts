import { describe, expect, it } from 'vitest';
import { HOME_SYSTEMS } from './home-systems';

describe('HOME_SYSTEMS', () => {
  it('surfaces exactly the three systems, in order', () => {
    expect(HOME_SYSTEMS.map((s) => s.id)).toEqual(['libera', 'facia', 'stratos']);
  });

  it('reuses the canonical project copy for libera and facia', () => {
    const libera = HOME_SYSTEMS.find((s) => s.id === 'libera');
    const facia = HOME_SYSTEMS.find((s) => s.id === 'facia');
    expect(libera?.href).toBe('https://github.com/jeremycapps/libera');
    expect(libera?.external).toBe(true);
    expect(facia?.href).toBe('https://github.com/jeremycapps/facia');
    expect(facia?.description).toContain('reusable interface recipes');
  });

  it('links StratOS to its in-app route, not an external repo', () => {
    const stratos = HOME_SYSTEMS.find((s) => s.id === 'stratos');
    expect(stratos?.external).toBe(false);
    expect(stratos?.href).toBe('/stratos-v2');
    expect(stratos?.category).toBe('Decision infrastructure');
  });

  it('places every marker between the two poles', () => {
    for (const system of HOME_SYSTEMS) {
      expect(system.poles).toHaveLength(2);
      expect(system.position).toBeGreaterThan(0);
      expect(system.position).toBeLessThan(1);
    }
  });
});
