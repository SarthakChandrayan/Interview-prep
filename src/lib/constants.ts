export const KINDS = ["problem", "concept", "behavioral"] as const;
export type Kind = (typeof KINDS)[number];

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
