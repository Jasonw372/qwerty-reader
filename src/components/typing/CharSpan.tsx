import { memo } from "react";
import type { CharStatus } from "../../types/index.ts";
import { useSettingsStore } from "../../store/settingsStore.ts";
import { cn } from "../../lib/cn.ts";

interface CharSpanProps {
  char: string;
  status: CharStatus;
}

export const CharSpan = memo(function CharSpan({ char, status }: CharSpanProps) {
  const isSpace = char === " ";
  const showSpaceSymbol = useSettingsStore((s) => s.showSpaceSymbol);

  const className =
    status === "correct" ? "animate-pop-in" : status === "incorrect" ? "animate-shake" : "";

  return (
    // key on status forces remount so pop-in replays each time
    <span
      key={status}
      className={cn(
        "inline-block transition-colors duration-[75ms]",
        (status === "pending" || status === "active") && "text-[var(--theme-text-pending)]",
        status === "correct" && "text-[var(--theme-text-correct)]",
        status === "incorrect" &&
          "rounded-[2px] bg-[var(--theme-text-error-bg)] text-[var(--theme-text-error)]",
        isSpace && "min-w-[1ch] text-center",
        isSpace && showSpaceSymbol && "space-symbol text-[0.52em] align-[0.08em] opacity-48",
        className,
      )}
      data-status={status}
    >
      {isSpace ? (showSpaceSymbol ? "_" : " ") : char}
    </span>
  );
});
