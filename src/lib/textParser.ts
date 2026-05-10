import type { CharState, ParagraphData } from "../types/index.ts";

function buildChars(text: string): CharState[] {
  return text.split("").map((char, index) => ({
    char,
    status: "pending" as const,
    index,
  }));
}

function splitSentences(paragraph: string): string[] {
  // Split on sentence-ending punctuation followed by a space or end of string
  const sentences = paragraph.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? [paragraph];
  return sentences.map((s) => s.trim()).filter((s) => s.length > 0);
}

export function parseArticle(content: string): ParagraphData[] {
  const paragraphs = content
    .split(/\n\n+/)
    .map((raw) => raw.trim())
    .filter((raw) => raw.length > 0);

  const sentences = paragraphs.flatMap((para) => splitSentences(para));

  return sentences.map((text, i) => ({
    id: `s-${i}`,
    text,
    chars: buildChars(text),
    focus: i === 0 ? ("active" as const) : ("upcoming" as const),
  }));
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
