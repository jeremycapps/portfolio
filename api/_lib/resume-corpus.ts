export interface ResumeBullet {
  id: string;
  text: string;
  evidenceRefs: string[];
  sourceRefs: string[];
}
export interface ResumeEngagement {
  id: string;
  organization: string;
  roleContext: string[];
  timePeriod: string;
  themes: string[];
  roleFit: { strongest: string[]; secondary: string[] };
  caution: string[];
  bullets: ResumeBullet[];
}
export interface ResumeSkillGroup { group: string; items: string[]; }
export interface ResumeEducation { degree: string; }
export interface ResumeProject { id: string; name: string; timePeriod: string; text: string; sourceRefs: string[]; }
export interface ResumeCorpus {
  header: { name: string; contacts: string[] };
  engagements: ResumeEngagement[];
  skills: ResumeSkillGroup[];
  education: ResumeEducation[];
  projects: ResumeProject[];
}

import { RESUME_CORPUS } from './resume-corpus.generated';

export function loadResumeCorpus(): ResumeCorpus {
  return RESUME_CORPUS;
}
