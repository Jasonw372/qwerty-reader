export const PRESET_TAGS = [
  "technology",
  "science",
  "literature",
  "business",
  "philosophy",
  "history",
  "psychology",
  "education",
  "nature",
  "society",
] as const;

export type ArticleTag = (typeof PRESET_TAGS)[number];
