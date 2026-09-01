import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createDecisionExperienceViewModel } from '../lib/stratos/decisions/presentation';
import { calculateFeasibility, DecisionExperience, STRATOS_SYSTEMS } from './stratos-v2';

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

describe('StratOS v2 decision experience', () => {
  const renderDecision = () => renderToStaticMarkup(
    createElement(DecisionExperience, { view: createDecisionExperienceViewModel() }),
  );

  it('identifies the dated Target Canada decision and its cutoff-safe overview', () => {
    const html = renderDecision();

    expect(html).toContain('Target Canada');
    expect(html).toContain('August 21, 2013');
    expect(html).toContain('68 stores operating');
    expect(html).toContain('56 stores planned to open');
    expect(html).toContain('FOG');
    expect(html).toContain('Not determined');
    expect(html).toContain('Material unknowns');
    expect(html).toContain('Documented readiness and release gates');
  });

  it('renders exactly two equally structured recommendation cards in plane order', () => {
    const html = renderDecision();
    const recommendationCards = html.match(/class="sv2-recommendation"/g) ?? [];

    expect(recommendationCards).toHaveLength(2);
    expect(html.indexOf('commitment operation')).toBeLessThan(html.indexOf('path operation'));
    expect(html.indexOf('HOLD')).toBeLessThan(html.indexOf('LEARN'));
    expect(html.match(/Why authorized/g)).toHaveLength(2);
    expect(html.match(/<h4>Boundary<\/h4>/g)).toHaveLength(2);
    expect(html.match(/<h4>Gate · analytical<\/h4>/g)).toHaveLength(2);
    expect(html.match(/<h4>Reassessment<\/h4>/g)).toHaveLength(2);
    expect(html.match(/<dt>Owner<\/dt>/g)).toHaveLength(2);
    expect(html.match(/<dt>Authority<\/dt>/g)).toHaveLength(2);
  });

  it('distinguishes actual and StratOS pairs while bounding the exposure claim', () => {
    const html = renderDecision();

    expect(html).toContain('Actual operations');
    expect(html).toContain('StratOS operations');
    expect(html.indexOf('Actual operations')).toBeLessThan(html.indexOf('StratOS operations'));
    expect(html).toContain('Store-activation exposure only');
    expect(html).toContain('next release decision or December 31, 2013');
    expect(html).toContain('does not establish that leases, remodeling, inventory, employment, or cash obligations could be avoided');
    expect(html).not.toContain('all obligations were avoidable');
    expect(html).not.toContain('would have succeeded');
    expect(html).not.toContain('would have made Target Canada succeed');
  });

  it('uses a named native radio control for keyboard-operable timeline selection', () => {
    const html = renderDecision();

    expect(html).toContain('<fieldset class="sv2-timeline">');
    expect(html).toContain('<legend>Decision timeline</legend>');
    expect(html).toContain('type="radio"');
    expect(html).toContain('name="stratos-decision-date"');
    expect(html).toContain('checked=""');
    expect(html).toContain('T2 · August 21, 2013');
  });

  it('shows complete evidence provenance and non-color-only status labels', () => {
    const html = renderDecision();

    expect(html).toContain('Source');
    expect(html).toContain('Locator');
    expect(html).toContain('Published');
    expect(html).toContain('Materiality');
    expect(html).toContain('Underlying origin');
    expect(html).toContain('Display status');
    expect(html).toContain('OBSERVED');
    expect(html).toContain('ESTIMATED');
    expect(html).toContain('FOG');
    expect(html).toContain('HINDSIGHT');
    expect(html).toContain('aria-hidden="true">●');
    expect(html).toContain('aria-hidden="true">△');
    expect(html).toContain('aria-hidden="true">?');
    expect(html).toContain('aria-hidden="true">◆');
  });

  it('keeps analytical constructs labeled and hindsight in a separate outcome layer', () => {
    const html = renderDecision();

    expect(html).toContain('T1: pilot/readiness review');
    expect(html).toContain('T2: 68-store scaling boundary');
    expect(html).toContain('Proposed readiness release gates');
    expect(html).toContain('ANALYTICAL');
    expect(html).toContain('Maximum unreleased store activations');
    expect(html).toContain('Calculation ·');
    expect(html).toContain('Counterfactual assumption ·');
    expect(html).toContain('Separate outcome layer');
    expect(html).toContain('Never used by the dated verdict or recommendations');
  });
});
