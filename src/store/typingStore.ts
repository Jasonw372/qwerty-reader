import { create } from "zustand";
import type { ParagraphData, CharStatus, Keystroke } from "../types/index.ts";
import { parseArticle } from "../lib/textParser.ts";
import { calcWPM, calcAccuracy, calcFinalWPM } from "../lib/wpm.ts";

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
  backspace: () => void;
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

    const newKeystrokes: Keystroke[] = [
      ...keystrokes,
      {
        timestamp: now,
        action: "type",
        correct,
        input,
        expected,
        paragraphIndex: activeParagraphIndex,
        charIndex: cursor,
      },
    ];

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
    let elapsed = get().elapsed;
    let wpm = calcWPM(newKeystrokes, now);

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
        elapsed = Math.floor((now - startTime) / 1000);
        wpm = calcFinalWPM(newKeystrokes, startTime, now);
      }
    }

    set({
      paragraphs: finalParagraphs,
      cursor: paraFinished ? 0 : nextCursor,
      activeParagraphIndex: nextParagraphIndex,
      keystrokes: newKeystrokes,
      startTime,
      elapsed,
      isFinished,
      wpm,
      accuracy: calcAccuracy(newKeystrokes),
    });
  },

  backspace() {
    const { paragraphs, activeParagraphIndex, cursor, keystrokes, startTime } = get();
    if (paragraphs.length === 0 || !startTime) return;

    const now = Date.now();
    const targetParagraphIndex = cursor > 0 ? activeParagraphIndex : activeParagraphIndex - 1;
    if (targetParagraphIndex < 0) return;

    const targetParagraph = paragraphs[targetParagraphIndex];
    const targetCursor = cursor > 0 ? cursor - 1 : targetParagraph.chars.length - 1;
    const targetChar = targetParagraph.chars[targetCursor];
    if (!targetChar || targetChar.status === "pending") return;

    let correctedTypeFound = false;
    const correctedKeystrokes = [...keystrokes].reverse().map((stroke) => {
      if (
        !correctedTypeFound &&
        stroke.action === "type" &&
        !stroke.corrected &&
        stroke.paragraphIndex === targetParagraphIndex &&
        stroke.charIndex === targetCursor
      ) {
        correctedTypeFound = true;
        return { ...stroke, corrected: true };
      }
      return stroke;
    });

    const orderedKeystrokes = correctedKeystrokes.reverse();
    const newKeystrokes: Keystroke[] = [
      ...orderedKeystrokes,
      {
        timestamp: now,
        action: "correction",
        correct: false,
        input: "Backspace",
        expected: targetChar.char,
        paragraphIndex: targetParagraphIndex,
        charIndex: targetCursor,
      },
    ];

    const finalParagraphs = paragraphs.map((paragraph, paragraphIndex) => {
      if (paragraphIndex === targetParagraphIndex) {
        const chars = paragraph.chars.map((char, charIndex) => {
          if (charIndex === targetCursor) return { ...char, status: "active" as CharStatus };
          if (cursor > 0 && charIndex === cursor)
            return { ...char, status: "pending" as CharStatus };
          return char;
        });
        return { ...paragraph, focus: "active" as const, chars };
      }

      if (cursor === 0 && paragraphIndex === activeParagraphIndex) {
        const chars = paragraph.chars.map((char, charIndex) =>
          charIndex === 0 && char.status === "active"
            ? { ...char, status: "pending" as CharStatus }
            : char,
        );
        return { ...paragraph, focus: "upcoming" as const, chars };
      }

      return paragraph;
    });

    set({
      paragraphs: finalParagraphs,
      activeParagraphIndex: targetParagraphIndex,
      cursor: targetCursor,
      keystrokes: newKeystrokes,
      isFinished: false,
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
