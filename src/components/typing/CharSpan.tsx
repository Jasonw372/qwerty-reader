import { memo } from "react";
import type { CharStatus } from "../../types/index.ts";

interface CharSpanProps {
  char: string;
  status: CharStatus;
}

const statusStyle: Record<CharStatus, React.CSSProperties> = {
  pending: { color: "var(--theme-text-pending)" },
  active: {
    color: "var(--theme-text-pending)",
    textDecoration: "underline",
    textDecorationColor: "var(--theme-cursor)",
    textUnderlineOffset: "4px",
  },
  correct: { color: "var(--theme-text-correct)" },
  incorrect: {
    color: "var(--theme-text-error)",
    backgroundColor: "var(--theme-text-error-bg)",
    borderRadius: "2px",
  },
};

export const CharSpan = memo(function CharSpan({ char, status }: CharSpanProps) {
  return (
    <span
      style={{
        display: "inline-block",
        transition: "color 75ms, background-color 75ms",
        ...statusStyle[status],
      }}
      className={status === "incorrect" ? "animate-shake" : undefined}
      data-status={status}
    >
      {char === " " ? " " : char}
    </span>
  );
});
