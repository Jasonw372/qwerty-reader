import type { Article } from "../../types/index.ts";
import { webDev } from "./web-dev.ts";
import { deepWork } from "./deep-work.ts";
import { paleBlueDot } from "./pale-blue-dot.ts";

export const PRESET_ARTICLES: Article[] = [webDev, deepWork, paleBlueDot];

export const PRESET_IDS: ReadonlySet<string> = new Set(PRESET_ARTICLES.map((a) => a.id));

export function isPresetArticle(id: string): boolean {
  return PRESET_IDS.has(id);
}
