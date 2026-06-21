#!/usr/bin/env python3
"""
Generates the SM-2 golden fixture (sm2_python_outputs.json) using a port of the
update_sr() logic from leetcode_tracker/database.py:110-166 with a PINNED today.

Re-run only when the Python algorithm is intentionally changed. The TS port in
src/main/domain/sm2.ts must produce byte-identical numbers + dates.

Usage:
    python3 tests/fixtures/gen_sm2_fixture.py
"""
import json
from datetime import date, timedelta
from pathlib import Path

TODAY = date(2026, 6, 19)


def apply_sm2(interval: int, repetitions: int, ease: float, quality: int):
    if quality == 0:
        repetitions = 0
        interval = 1
    elif quality == 2:
        repetitions = 0
        interval = 2
    elif quality == 3:
        if repetitions == 0:
            interval = 3
        elif repetitions == 1:
            interval = 7
        else:
            interval = max(7, round(interval * ease))
        repetitions += 1
    elif quality == 4:
        if repetitions == 0:
            interval = 7
        elif repetitions == 1:
            interval = 14
        else:
            interval = max(14, round(interval * ease))
        repetitions += 1
    elif quality == 5:
        if repetitions == 0:
            interval = 30
        elif repetitions == 1:
            interval = 30
        else:
            interval = max(30, round(interval * ease))
        repetitions += 1

    ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    ease = max(1.3, ease)
    next_review = (TODAY + timedelta(days=interval)).isoformat()
    return interval, repetitions, ease, next_review


def main():
    cases = []

    # Single-step cases: every quality applied to a grid of starting states.
    starting_states = [
        (1, 0, 2.5),
        (2, 0, 2.5),
        (3, 1, 2.5),
        (7, 2, 2.5),
        (14, 3, 2.36),
        (30, 5, 1.7),
        (60, 8, 1.3),
        (100, 10, 2.92),
    ]
    for s in starting_states:
        for q in (0, 2, 3, 4, 5):
            interval, repetitions, ease, next_review = apply_sm2(*s, q)
            cases.append({
                "kind": "single",
                "input": {
                    "interval": s[0], "repetitions": s[1], "ease": s[2],
                    "quality": q,
                },
                "output": {
                    "interval": interval,
                    "repetitions": repetitions,
                    "ease": ease,
                    "nextReviewISO": next_review,
                },
            })

    # Sequence cases: apply N qualities in order from default state.
    sequences = [
        [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
        [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
        [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
        [3, 4, 5, 3, 4, 5, 3, 4, 5, 3],
        [5, 5, 0, 3, 3, 2, 4, 4, 3, 5],
        [0, 0, 0, 2, 2, 2, 3, 3, 4, 5],
        [5, 4, 3, 2, 0, 5, 4, 3, 2, 0],
    ]
    for seq in sequences:
        interval, repetitions, ease = 1, 0, 2.5
        steps = []
        for q in seq:
            interval, repetitions, ease, next_review = apply_sm2(interval, repetitions, ease, q)
            steps.append({
                "quality": q,
                "interval": interval,
                "repetitions": repetitions,
                "ease": ease,
                "nextReviewISO": next_review,
            })
        cases.append({"kind": "sequence", "start": {"interval": 1, "repetitions": 0, "ease": 2.5}, "steps": steps})

    out = {
        "today": TODAY.isoformat(),
        "cases": cases,
    }
    path = Path(__file__).parent / "sm2_python_outputs.json"
    path.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {path} with {len(cases)} cases")


if __name__ == "__main__":
    main()
