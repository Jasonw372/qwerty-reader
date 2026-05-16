import type { DifficultyLevel } from "../types";

export function calculateDifficulty(content: string): DifficultyLevel {
  const words = content.toLowerCase().match(/[a-z']+/g) ?? [];
  if (words.length === 0) return "easy";

  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;

  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : words.length;

  const uniqueWords = new Set(words);
  const diversity = uniqueWords.size / words.length;

  let score = 0;

  if (avgWordLength > 5.5) score += 2;
  else if (avgWordLength > 4.5) score += 1;

  if (avgSentenceLength > 25) score += 2;
  else if (avgSentenceLength > 15) score += 1;

  if (diversity > 0.7) score += 2;
  else if (diversity > 0.55) score += 1;

  if (score >= 4) return "hard";
  if (score >= 2) return "medium";
  return "easy";
}
