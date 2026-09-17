// gpaScale.cjs — Faculty "Royal Violet" graded scale & helpers (project-ASCII).
// Standalone pure functions; no deps. Used by parser, seeders, and unit tests.

const SCALE = [
  { letter: 'A',  min: 80, points: 4.0 },
  { letter: 'B+', min: 70, points: 3.5 },
  { letter: 'B',  min: 60, points: 3.0 },
  { letter: 'C',  min: 50, points: 2.0 },
  { letter: 'F',  min: 0,  points: 0.0 }
];

function letterFor(score) {
  if (score === null || score === undefined || Number.isNaN(Number(score))) return null;
  const s = Number(score);
  for (const g of SCALE) if (s >= g.min) return g.letter;
  return 'F';
}

function pointsFor(gradePointNote, rawPoints) {
  // Blueprint 3.3 course-level codes
  if (gradePointNote === 'Sup') return Math.min(rawPoints, 2.0); // cap at C
  if (gradePointNote === 'Inc') return null; // excluded from GPA denominator
  return rawPoints; // Sub, Cro, Rtk, Rst, NONE — full A–F range (Sub uncapped)
}

function linearPts(score) {
  // fine-grained Q points for distribution/bell curves; not used in official GPA
  const f = letterFor(score);
  if (f === null) return null;
  return pointsFor(null, Number(score));
}

module.exports = { SCALE, letterFor, pointsFor, linearPts };
