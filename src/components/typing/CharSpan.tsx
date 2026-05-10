import { memo } from "react";
import type { CharStatus } from "../../types/index.ts";

interface CharSpanProps {
  char: string;
  status: CharStatus;
}

const baseStyle: React.CSSProperties = {
  display: "inline-block",
  transition: "color 75ms",
};

export const CharSpan = memo(function CharSpan({ char, status }: CharSpanProps) {
  const style: React.CSSProperties = {
    ...baseStyle,
    ...(status === "pending" && { color: "var(--theme-text-pending)" }),
    ...(status === "active" && { color: "var(--theme-text-pending)" }),
    ...(status === "correct" && { color: "var(--theme-text-correct)" }),
    ...(status === "incorrect" && {
      color: "var(--theme-text-error)",
      backgroundColor: "var(--theme-text-error-bg)",
      borderRadius: "2px",
    }),
    ...(char === " " && { minWidth: "0.5ch" }),
  };

  const className =
    status === "correct"
      ? "animate-pop-in"
      : status === "incorrect"
        ? "animate-shake"
        : status === "active"
          ? "animate-pulse-glow"
          : undefined;

  return (
    // key on status forces remount so pop-in replays each time
    <span key={status} style={style} className={className} data-status={status}>
      {char === " " ? " " : char}
    </span>
  );
});
