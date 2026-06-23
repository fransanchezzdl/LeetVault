import { describe, it, expect } from 'vitest';
import { INTERVIEW_PROBLEMS } from '../../src/main/interview/problems';
import { pickProblem, getProblemById, publicView } from '../../src/main/interview/picker';

describe('interview problem dataset', () => {
  it('loads at least 20 problems', () => {
    expect(INTERVIEW_PROBLEMS.length).toBeGreaterThanOrEqual(20);
  });

  it('has a healthy difficulty spread', () => {
    const easy = INTERVIEW_PROBLEMS.filter((p) => p.difficulty === 'Easy').length;
    const med = INTERVIEW_PROBLEMS.filter((p) => p.difficulty === 'Medium').length;
    const hard = INTERVIEW_PROBLEMS.filter((p) => p.difficulty === 'Hard').length;
    expect(easy).toBeGreaterThanOrEqual(5);
    expect(med).toBeGreaterThanOrEqual(5);
    expect(hard).toBeGreaterThanOrEqual(5);
  });

  it('has unique ids', () => {
    const ids = INTERVIEW_PROBLEMS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('hides solution and full constraints from publicView', () => {
    const p = INTERVIEW_PROBLEMS[0];
    const pub = publicView(p);
    expect(pub).not.toHaveProperty('expected_solution');
    expect(pub).not.toHaveProperty('full_constraints');
    expect(pub).toHaveProperty('title');
    expect(pub).toHaveProperty('vague_description');
  });

  it('picker respects difficulty filter', () => {
    for (let i = 0; i < 30; i++) {
      const p = pickProblem('Hard');
      expect(p?.difficulty).toBe('Hard');
    }
  });

  it('picker returns any difficulty when unknown', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 60; i++) {
      const p = pickProblem('unknown');
      if (p) seen.add(p.difficulty);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('picker honors exclusion set', () => {
    const exclude = new Set(INTERVIEW_PROBLEMS.slice(0, INTERVIEW_PROBLEMS.length - 1).map((p) => p.id));
    const p = pickProblem('unknown', exclude);
    expect(p?.id).toBe(INTERVIEW_PROBLEMS[INTERVIEW_PROBLEMS.length - 1].id);
  });

  it('getProblemById round-trips', () => {
    const first = INTERVIEW_PROBLEMS[0];
    expect(getProblemById(first.id)?.id).toBe(first.id);
    expect(getProblemById('nope-does-not-exist')).toBeUndefined();
  });
});
