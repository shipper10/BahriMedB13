/**
 * gpa/weights.ts — Faculty weighting model (blueprint 3.1).
 * Index k corresponds to year (year-1 -> index 0).
 */
export const YEAR_WEIGHTS: readonly number[] = [
  0.05, // Year 1  (Pre-Clinical I)   w_1
  0.1, //  Year 2  (Pre-Clinical II)  w_2
  0.1, //  Year 3  (Pre-Clinical III) w_3
  0.15, // Year 4  (Clinical I)        w_4
  0.2, //  Year 5  (Clinical II)       w_5
  0.4, //  Year 6  (Clinical III)      w_6
];

/** Alias kept for backward compatibility with the original module. */
export const WEIGHTS: readonly number[] = YEAR_WEIGHTS;

/** Human-readable labels for each academic year. */
export const YEAR_LABELS: readonly string[] = [
  'Y1',
  'Y2',
  'Y3',
  'Y4',
  'Y5',
  'Y6',
];