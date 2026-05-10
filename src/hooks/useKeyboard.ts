import { useEffect } from "react";
import { useTypingStore } from "../store/typingStore.ts";

export function useKeyboard(): void {
  const typeChar = useTypingStore((s) => s.typeChar);
  const reset = useTypingStore((s) => s.reset);
  const isFinished = useTypingStore((s) => s.isFinished);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (isFinished) return;

      // Ignore modifier-only keys and function keys
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key === "Escape") {
        reset();
        return;
      }
      if (e.key.length !== 1) return;

      e.preventDefault();
      typeChar(e.key);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [typeChar, reset, isFinished]);
}
