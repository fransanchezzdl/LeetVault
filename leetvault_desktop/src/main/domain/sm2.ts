import type { Quality } from '@shared/types/review';

export interface SrState {
  interval: number;
  repetitions: number;
  ease: number;
}

export interface SrUpdate extends SrState {
  nextReviewISO: string;
}

/**
 * Python `round()` uses banker's rounding (round-half-to-even).
 * JS `Math.round()` rounds half away from zero (positive) / towards zero (negative).
 * SM-2 intervals are positive integers × ease (~2.5), so collisions on exact `.5`
 * are rare but possible (e.g. 7×2.5 = 17.5). Match Python to keep the golden fixture exact.
 */
function pyRound(x: number): number {
  const floor = Math.floor(x);
  const diff = x - floor;
  if (diff < 0.5) return floor;
  if (diff > 0.5) return floor + 1;
  return floor % 2 === 0 ? floor : floor + 1;
}

function isoDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDaysUTC(d: Date, days: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + days));
}

/**
 * SM-2 with calibrated fixed seeds. Mirrors `leetcode_tracker/database.py:110-166`
 * byte-for-byte. Only qualities 0, 2, 3, 4, 5 are valid (no 1).
 *
 * Quality semantics (Spanish in v1 UI):
 *   0 Blackout  → full reset, interval=1
 *   2 Difícil   → soft reset, interval=2, reps=0
 *   3 Bien      → seed 3→7→max(7,  round(int*ease)), reps++
 *   4 Fácil     → seed 7→14→max(14, round(int*ease)), reps++
 *   5 Perfecto  → seed 30→30→max(30, round(int*ease)), reps++
 *
 * Ease updated on EVERY quality: ease += 0.1 − (5−q)·(0.08 + (5−q)·0.02), floor 1.3.
 */
export function applySm2(prev: SrState, quality: Quality, today: Date = new Date()): SrUpdate {
  let { interval, repetitions, ease } = prev;

  if (quality === 0) {
    repetitions = 0;
    interval = 1;
  } else if (quality === 2) {
    repetitions = 0;
    interval = 2;
  } else if (quality === 3) {
    if (repetitions === 0) interval = 3;
    else if (repetitions === 1) interval = 7;
    else interval = Math.max(7, pyRound(interval * ease));
    repetitions += 1;
  } else if (quality === 4) {
    if (repetitions === 0) interval = 7;
    else if (repetitions === 1) interval = 14;
    else interval = Math.max(14, pyRound(interval * ease));
    repetitions += 1;
  } else if (quality === 5) {
    if (repetitions === 0) interval = 30;
    else if (repetitions === 1) interval = 30;
    else interval = Math.max(30, pyRound(interval * ease));
    repetitions += 1;
  }

  ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease < 1.3) ease = 1.3;

  const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const nextReviewISO = isoDate(addDaysUTC(todayUtc, interval));

  return { interval, repetitions, ease, nextReviewISO };
}
