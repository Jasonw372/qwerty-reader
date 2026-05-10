import { useEffect, useRef } from "react";
import { useTypingStore } from "../store/typingStore.ts";

export function useTimer(): void {
  const tick = useTypingStore((s) => s.tick);
  const startTime = useTypingStore((s) => s.startTime);
  const isFinished = useTypingStore((s) => s.isFinished);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (startTime && !isFinished) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTime, isFinished, tick]);
}
