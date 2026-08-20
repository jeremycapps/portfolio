import type { ResumeCorpus } from './resume-corpus';

export interface RankedBullet {
  engagementId: string;
  bulletId: string;
  text: string;
  score: number;
}

export function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

export function prerank(job: string, corpus: ResumeCorpus): RankedBullet[] {
  const jobTokens = new Set(tokenize(job));
  const phraseHits = (phrases: string[]) =>
    phrases.reduce((n, p) => n + (tokenize(p).some((t) => jobTokens.has(t)) ? 1 : 0), 0);

  const ranked: RankedBullet[] = [];
  for (const eng of corpus.engagements) {
    const themeScore = phraseHits(eng.themes) * 3;
    const fitScore = phraseHits([...eng.roleFit.strongest, ...eng.roleFit.secondary]) * 2;
    for (const b of eng.bullets) {
      const bulletScore = tokenize(b.text).filter((t) => jobTokens.has(t)).length;
      ranked.push({
        engagementId: eng.id,
        bulletId: b.id,
        text: b.text,
        score: themeScore + fitScore + bulletScore,
      });
    }
  }
  // Stable sort by score desc; ties keep corpus order.
  return ranked
    .map((r, i) => ({ r, i }))
    .sort((a, b) => b.r.score - a.r.score || a.i - b.i)
    .map(({ r }) => r);
}
