import { useEffect } from "react";
import { useTypingStore } from "../store/typingStore.ts";
import { useSettingsStore } from "../store/settingsStore.ts";
import { useArticleStore } from "../store/articleStore.ts";
import { playCorrect, playIncorrect, playKeyup, resumeAudio } from "../lib/audio.ts";

export function useKeyboard(enabled = true): void {
  const typeChar = useTypingStore((s) => s.typeChar);
  const backspace = useTypingStore((s) => s.backspace);
  const shiftViewOffset = useTypingStore((s) => s.shiftViewOffset);
  const resetViewOffset = useTypingStore((s) => s.resetViewOffset);
  const reset = useTypingStore((s) => s.reset);
  const isFinished = useTypingStore((s) => s.isFinished);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const managerOpen = useArticleStore((s) => s.managerOpen);
  const settingsOpen = useSettingsStore((s) => s.settingsOpen);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (!enabled) return;
      if (managerOpen || settingsOpen) return;
      if (e.key === "Escape") {
        reset();
        return;
      }
      if (e.key === "PageUp" || e.key === "ArrowUp") {
        e.preventDefault();
        shiftViewOffset(-1);
        return;
      }
      if (e.key === "PageDown" || e.key === "ArrowDown") {
        e.preventDefault();
        shiftViewOffset(1);
        return;
      }
      if (isFinished) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key === "Backspace") {
        e.preventDefault();
        resetViewOffset();
        backspace();
        return;
      }
      if (e.key.length !== 1) return;

      e.preventDefault();
      resetViewOffset();
      resumeAudio();

      const { paragraphs, activeParagraphIndex, cursor } = useTypingStore.getState();
      const para = paragraphs[activeParagraphIndex];
      const expected = para?.chars[cursor]?.char;
      const correct = expected === e.key;

      if (soundEnabled) {
        if (correct) playCorrect(e.key === " ");
        else playIncorrect();
      }

      typeChar(e.key);
    }

    function handleKeyUp(e: KeyboardEvent): void {
      if (!enabled) return;
      if (managerOpen || settingsOpen) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key.length !== 1) return;
      if (soundEnabled) playKeyup();
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    enabled,
    typeChar,
    backspace,
    shiftViewOffset,
    resetViewOffset,
    reset,
    isFinished,
    soundEnabled,
    managerOpen,
    settingsOpen,
  ]);
}
