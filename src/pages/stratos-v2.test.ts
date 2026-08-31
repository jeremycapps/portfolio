import { describe, expect, it } from 'vitest';
import { calculateFeasibility, STRATOS_SYSTEMS } from './stratos-v2';

describe('StratOS v2 feasibility model', () => {
  const execution = STRATOS_SYSTEMS.find((system) => system.id === 'execution')!;

  it('keeps the baseline execution cycle outside the commitment date', () => {
    const result = calculateFeasibility(execution, execution.cycle2);

    expect(result.calendarGoal).toBeCloseTo(17.2);
    expect(result.calendarPass).toBe(false);
    expect(result.constraintPass).toBe(false);
  });

  it('distinguishes calendar convergence from organizational feasibility', () => {
    const result = calculateFeasibility(execution, 12.8);

    expect(result.calendarPass).toBe(true);
    expect(result.constraintPass).toBe(false);
    expect(result.loads[0][0]).toBe('Risk tolerance');
  });

  it('models all six coupled organizational conversions', () => {
    expect(STRATOS_SYSTEMS.map((system) => system.name)).toEqual([
      'Discernment',
      'Invention',
      'Operations',
      'Execution',
      'Advantage',
      'Resource',
    ]);
  });
});
