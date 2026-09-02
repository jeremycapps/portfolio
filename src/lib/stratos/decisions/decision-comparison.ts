import type { MetricRange, MetricValue } from '../cases/profile';
import type {
  ActualOperation,
  EvidenceDisplayState,
  ExposureCategory,
} from './decision-point';
import type { OperationRecommendation } from './judgment';

export interface ExposureComparisonValue {
  readonly status: EvidenceDisplayState;
  readonly label: string;
  readonly metric?: MetricValue | MetricRange;
  readonly calculation?: string;
  readonly assumption?: string;
}

export interface ExposureComparisonCategory {
  readonly category: ExposureCategory;
  readonly actualIntent: ExposureComparisonValue;
  readonly stratosScenario: ExposureComparisonValue;
  readonly limitation: string;
}

export interface DecisionComparison {
  readonly decisionPointId: string;
  readonly period: {
    readonly startsAt: string;
    readonly endsAt: string;
    readonly endBasis: string;
  };
  readonly actualOperations: readonly ActualOperation[];
  readonly stratosOperations: readonly OperationRecommendation[];
  readonly exposures: Readonly<Record<ExposureCategory, ExposureComparisonCategory>>;
  readonly caveats: readonly string[];
}
