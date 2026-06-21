import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { applySm2, type SrState } from '../../src/main/domain/sm2';

type Quality = 0 | 2 | 3 | 4 | 5;

interface SingleCase {
  kind: 'single';
  input: { interval: number; repetitions: number; ease: number; quality: Quality };
  output: { interval: number; repetitions: number; ease: number; nextReviewISO: string };
}

interface SequenceStep {
  quality: Quality;
  interval: number;
  repetitions: number;
  ease: number;
  nextReviewISO: string;
}

interface SequenceCase {
  kind: 'sequence';
  start: SrState;
  steps: SequenceStep[];
}

interface Fixture {
  today: string;
  cases: (SingleCase | SequenceCase)[];
}

const fixture: Fixture = JSON.parse(
  readFileSync(resolve(__dirname, '../fixtures/sm2_python_outputs.json'), 'utf8')
);

function parsePinnedToday(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const TODAY = parsePinnedToday(fixture.today);
const EPS = 1e-9;

describe('applySm2 — parity with Python golden fixture', () => {
  for (const [i, c] of fixture.cases.entries()) {
    if (c.kind === 'single') {
      it(`single case #${i}: q=${c.input.quality}, state=(${c.input.interval},${c.input.repetitions},${c.input.ease})`, () => {
        const got = applySm2(
          { interval: c.input.interval, repetitions: c.input.repetitions, ease: c.input.ease },
          c.input.quality,
          TODAY
        );
        expect(got.interval).toBe(c.output.interval);
        expect(got.repetitions).toBe(c.output.repetitions);
        expect(Math.abs(got.ease - c.output.ease)).toBeLessThanOrEqual(EPS);
        expect(got.nextReviewISO).toBe(c.output.nextReviewISO);
      });
    } else {
      it(`sequence case #${i}: ${c.steps.length} steps from default`, () => {
        let state: SrState = { ...c.start };
        for (const [j, step] of c.steps.entries()) {
          const got = applySm2(state, step.quality, TODAY);
          expect(got.interval, `step ${j} interval`).toBe(step.interval);
          expect(got.repetitions, `step ${j} repetitions`).toBe(step.repetitions);
          expect(Math.abs(got.ease - step.ease), `step ${j} ease`).toBeLessThanOrEqual(EPS);
          expect(got.nextReviewISO, `step ${j} nextReviewISO`).toBe(step.nextReviewISO);
          state = { interval: got.interval, repetitions: got.repetitions, ease: got.ease };
        }
      });
    }
  }
});
