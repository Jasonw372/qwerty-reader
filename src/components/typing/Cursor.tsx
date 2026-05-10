import { cn } from "../../lib/cn.ts";

interface CursorProps {
  visible: boolean;
}

export function Cursor({ visible }: CursorProps) {
  return (
    <span
      className={cn(
        "inline-block w-0.5 h-[1.2em] align-middle -ml-0.5",
        "bg-[var(--theme-cursor)] animate-blink",
        !visible && "hidden",
      )}
      aria-hidden="true"
    />
  );
}
