// Routine film clips, one per step of "A day with Rosaleigh".
// Put the MP4 files in /public/videos/ and list them here; a step with no clip
// keeps showing its store photo. File names match the AI video prompt doc.
//
// Example once the clips exist:
//   0: "/videos/routine-1-face-wash.mp4",
//   1: "/videos/routine-2-strips.mp4",
//   2: "/videos/routine-3-spf.mp4",
//   3: "/videos/routine-4-balm.mp4",
//   4: "/videos/routine-5-face-wash-pm.mp4",
//   5: "/videos/routine-6-night-cream.mp4",
export const ROUTINE_FILMS: Partial<Record<number, string>> = {};
