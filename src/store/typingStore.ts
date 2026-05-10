import { create } from "zustand";
import type { ParagraphData, CharStatus, Keystroke } from "../types/index.ts";
import { parseArticle } from "../lib/textParser.ts";
import { calcWPM, calcAccuracy } from "../lib/wpm.ts";

interface TypingState {
  paragraphs: ParagraphData[];
  activeParagraphIndex: number;
  cursor: number;
  keystrokes: Keystroke[];
  startTime: number | null;
  elapsed: number;
  isFinished: boolean;

  wpm: number;
  accuracy: number;

  loadArticle: (content: string) => void;
  typeChar: (input: string) => void;
  reset: () => void;
  tick: () => void;
}

export const useTypingStore = create<TypingState>((set, get) => ({
  paragraphs: [],
  activeParagraphIndex: 0,
  cursor: 0,
  keystrokes: [],
  startTime: null,
  elapsed: 0,
  isFinished: false,
  wpm: 0,
  accuracy: 100,

  loadArticle(content) {
    const parsed = parseArticle(content);
    // Mark the very first character as active
    if (parsed[0]?.chars[0]) {
      parsed[0].chars[0] = { ...parsed[0].chars[0], status: "active" };
    }
    set({
      paragraphs: parsed,
      activeParagraphIndex: 0,
      cursor: 0,
      keystrokes: [],
      startTime: null,
      elapsed: 0,
      isFinished: false,
      wpm: 0,
      accuracy: 100,
    });
  },

  typeChar(input) {
    const { paragraphs, activeParagraphIndex, cursor, keystrokes } = get();
    if (paragraphs.length === 0) return;

    const now = Date.now();
    const startTime = get().startTime ?? now;
    const para = paragraphs[activeParagraphIndex];
    if (!para || cursor >= para.chars.length) return;

    const expected = para.chars[cursor].char;
    const correct = input === expected;
    const newStatus: CharStatus = correct ? "correct" : "incorrect";

    const newKeystrokes: Keystroke[] = [...keystrokes, { timestamp: now, correct }];

    const updatedChars = para.chars.map((c, i) => {
      if (i === cursor) return { ...c, status: newStatus };
      if (i === cursor + 1) return { ...c, status: "active" as CharStatus };
      return c;
    });

    const updatedParagraphs = paragraphs.map((p, i) =>
      i === activeParagraphIndex ? { ...p, chars: updatedChars } : p,
    );

    const nextCursor = cursor + 1;
    const paraFinished = nextCursor >= para.chars.length;

    let nextParagraphIndex = activeParagraphIndex;
    let finalParagraphs = updatedParagraphs;
    let isFinished = false;

    if (paraFinished) {
      const hasNext = activeParagraphIndex + 1 < paragraphs.length;
      if (hasNext) {
        nextParagraphIndex = activeParagraphIndex + 1;
        finalParagraphs = updatedParagraphs.map((p, i) => {
          if (i === activeParagraphIndex) return { ...p, focus: "done" as const };
          if (i === nextParagraphIndex) {
            // Mark first char of next paragraph as active
            const chars = p.chars.map((c, ci) =>
              ci === 0 ? { ...c, status: "active" as CharStatus } : c,
            );
            return { ...p, focus: "active" as const, chars };
          }
          return p;
        });
      } else {
        isFinished = true;
      }
    }

    set({
      paragraphs: finalParagraphs,
      cursor: paraFinished ? 0 : nextCursor,
      activeParagraphIndex: nextParagraphIndex,
      keystrokes: newKeystrokes,
      startTime,
      isFinished,
      wpm: calcWPM(newKeystrokes, now),
      accuracy: calcAccuracy(newKeystrokes),
    });
  },

  reset() {
    const { paragraphs } = get();
    const allText = paragraphs.map((p) => p.text).join("\n\n");
    get().loadArticle(allText);
  },

  tick() {
    const { startTime, isFinished } = get();
    if (!startTime || isFinished) return;
    set({ elapsed: Math.floor((Date.now() - startTime) / 1000) });
  },
}));
