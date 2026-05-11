import { create } from "zustand";
import type { ParagraphData, CharStatus, Keystroke } from "../types/index.ts";
import { parseArticle } from "../lib/textParser.ts";
import { calcFinalWPM } from "../lib/wpm.ts";

const WPM_WINDOW_MS = 10_000;

interface TypingState {
  paragraphs: ParagraphData[];
  activeParagraphIndex: number;
  viewOffset: number;
  cursor: number;
  keystrokes: Keystroke[];
  startTime: number | null;
  elapsed: number;
  isFinished: boolean;

  wpm: number;
  accuracy: number;
  effectiveTypeCount: number;
  correctTypeCount: number;
  recentCorrectTimestamps: number[];

  loadArticle: (content: string) => void;
  clearSession: () => void;
  typeChar: (input: string) => void;
  backspace: () => void;
  shiftViewOffset: (delta: number) => void;
  resetViewOffset: () => void;
  reset: () => void;
  tick: () => void;
}

export const useTypingStore = create<TypingState>((set, get) => ({
  paragraphs: [],
  activeParagraphIndex: 0,
  viewOffset: 0,
  cursor: 0,
  keystrokes: [],
  startTime: null,
  elapsed: 0,
  isFinished: false,
  wpm: 0,
  accuracy: 100,
  effectiveTypeCount: 0,
  correctTypeCount: 0,
  recentCorrectTimestamps: [],

  loadArticle(content) {
    const parsed = parseArticle(content);
    // Mark the very first character as active
    if (parsed[0]?.chars[0]) {
      parsed[0].chars[0] = { ...parsed[0].chars[0], status: "active" };
    }
    set({
      paragraphs: parsed,
      activeParagraphIndex: 0,
      viewOffset: 0,
      cursor: 0,
      keystrokes: [],
      startTime: null,
      elapsed: 0,
      isFinished: false,
      wpm: 0,
      accuracy: 100,
      effectiveTypeCount: 0,
      correctTypeCount: 0,
      recentCorrectTimestamps: [],
    });
  },

  clearSession() {
    set({
      paragraphs: [],
      activeParagraphIndex: 0,
      viewOffset: 0,
      cursor: 0,
      keystrokes: [],
      startTime: null,
      elapsed: 0,
      isFinished: false,
      wpm: 0,
      accuracy: 100,
      effectiveTypeCount: 0,
      correctTypeCount: 0,
      recentCorrectTimestamps: [],
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
    let effectiveTypeCount = get().effectiveTypeCount + 1;
    let correctTypeCount = get().correctTypeCount + (correct ? 1 : 0);
    let recentCorrectTimestamps = get().recentCorrectTimestamps;
    if (correct) recentCorrectTimestamps = [...recentCorrectTimestamps, now];
    recentCorrectTimestamps = recentCorrectTimestamps.filter((ts) => now - ts <= WPM_WINDOW_MS);
    let wpm = Math.round((recentCorrectTimestamps.length / 5) * 6);
    let accuracy = Math.round((correctTypeCount / effectiveTypeCount) * 100);

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
      viewOffset: 0,
      keystrokes: newKeystrokes,
      startTime,
      elapsed,
      isFinished,
      wpm,
      accuracy,
      effectiveTypeCount,
      correctTypeCount,
      recentCorrectTimestamps,
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
    let correctedWasCorrect = false;
    let correctedTimestamp: number | null = null;
    const correctedKeystrokes = [...keystrokes].reverse().map((stroke) => {
      if (
        !correctedTypeFound &&
        stroke.action === "type" &&
        !stroke.corrected &&
        stroke.paragraphIndex === targetParagraphIndex &&
        stroke.charIndex === targetCursor
      ) {
        correctedTypeFound = true;
        correctedWasCorrect = stroke.correct;
        correctedTimestamp = stroke.timestamp;
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

    if (!correctedTypeFound) return;

    let effectiveTypeCount = Math.max(0, get().effectiveTypeCount - 1);
    let correctTypeCount = Math.max(0, get().correctTypeCount - (correctedWasCorrect ? 1 : 0));
    let recentCorrectTimestamps = get().recentCorrectTimestamps.filter(
      (ts) => now - ts <= WPM_WINDOW_MS,
    );
    if (correctedWasCorrect && correctedTimestamp !== null) {
      const idx = recentCorrectTimestamps.indexOf(correctedTimestamp);
      if (idx !== -1) {
        recentCorrectTimestamps = [
          ...recentCorrectTimestamps.slice(0, idx),
          ...recentCorrectTimestamps.slice(idx + 1),
        ];
      }
    }
    const wpm = Math.round((recentCorrectTimestamps.length / 5) * 6);
    const accuracy =
      effectiveTypeCount === 0 ? 100 : Math.round((correctTypeCount / effectiveTypeCount) * 100);

    set({
      paragraphs: finalParagraphs,
      activeParagraphIndex: targetParagraphIndex,
      viewOffset: 0,
      cursor: targetCursor,
      keystrokes: newKeystrokes,
      isFinished: false,
      wpm,
      accuracy,
      effectiveTypeCount,
      correctTypeCount,
      recentCorrectTimestamps,
    });
  },

  shiftViewOffset(delta) {
    const { paragraphs, activeParagraphIndex, viewOffset } = get();
    if (paragraphs.length === 0 || delta === 0) return;

    const minOffset = -activeParagraphIndex;
    const maxOffset = paragraphs.length - 1 - activeParagraphIndex;
    const nextOffset = Math.max(minOffset, Math.min(maxOffset, viewOffset + delta));
    if (nextOffset === viewOffset) return;
    set({ viewOffset: nextOffset });
  },

  resetViewOffset() {
    if (get().viewOffset === 0) return;
    set({ viewOffset: 0 });
  },

  reset() {
    const { paragraphs } = get();
    if (paragraphs.length === 0) return;
    const allText = paragraphs.map((p) => p.text).join("\n\n");
    get().loadArticle(allText);
  },

  tick() {
    const { startTime, isFinished } = get();
    if (!startTime || isFinished) return;
    const now = Date.now();
    const recentCorrectTimestamps = get().recentCorrectTimestamps.filter(
      (ts) => now - ts <= WPM_WINDOW_MS,
    );
    set({
      elapsed: Math.floor((now - startTime) / 1000),
      recentCorrectTimestamps,
      wpm: Math.round((recentCorrectTimestamps.length / 5) * 6),
    });
  },
}));
