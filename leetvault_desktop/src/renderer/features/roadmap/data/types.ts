export type LcDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface RoadmapProblem {
  n: number;
  title: string;
  slug: string;
  diff: LcDifficulty;
  premium?: boolean;
}

export interface RoadmapCategory {
  id: string;
  name: string;
  /** Grid position; the tree component scales this onto a viewBox. */
  x: number;
  y: number;
  /** Category ids this depends on (drawn as edges). */
  prereqs: string[];
  problems: RoadmapProblem[];
}

export interface RoadmapList {
  id: string;
  name: string;
  /** Total problem count, precomputed for the header. */
  total: number;
  categories: RoadmapCategory[];
}
