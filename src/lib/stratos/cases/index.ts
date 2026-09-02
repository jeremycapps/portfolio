import { ADOBE_CREATIVE_CLOUD } from './adobe-creative-cloud';
import { DOMINOS_2025_GROWTH } from './dominos-2025-growth';
import { FORD_MODEL_E } from './ford-model-e';
import { TARGET_CANADA } from './target-canada';
import { VA_EHR_MODERNIZATION } from './va-ehr-modernization';

export { ADOBE_CREATIVE_CLOUD } from './adobe-creative-cloud';
export { DOMINOS_2025_GROWTH } from './dominos-2025-growth';
export { FORD_MODEL_E } from './ford-model-e';
export { TARGET_CANADA } from './target-canada';
export { VA_EHR_MODERNIZATION } from './va-ehr-modernization';
export * from './profile';

export const STRATOS_CASE_PROFILES = [
  TARGET_CANADA,
  ADOBE_CREATIVE_CLOUD,
  DOMINOS_2025_GROWTH,
  FORD_MODEL_E,
  VA_EHR_MODERNIZATION,
] as const;
