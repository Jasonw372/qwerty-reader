import { useSettingsStore } from "../../store/settingsStore.ts";
import { cn } from "../../lib/cn.ts";

interface CursorProps {
  visible: boolean;
}

export function Cursor({ visible }: CursorProps) {
  const cursorStyle = useSettingsStore((s) => s.cursorStyle);

  const styleMap = {
    line: "w-0.5 h-[1.2em] align-middle -ml-0.5",
    block: "w-[0.6em] h-[1.2em] align-middle -ml-[0.6em] opacity-40",
    underline: "w-[0.6em] h-[2px] align-bottom -ml-[0.6em]",
  };

  return (
    <span
      className={cn(
        "inline-block bg-[var(--theme-cursor)] animate-blink",
        styleMap[cursorStyle],
        !visible && "hidden",
      )}
      aria-hidden="true"
    />
  );
}
