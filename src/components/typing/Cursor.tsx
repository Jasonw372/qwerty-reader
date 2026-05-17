import { useSettingsStore } from "../../store/settingsStore.ts";
import { cn } from "../../lib/cn.ts";

interface CursorProps {
  visible: boolean;
}

export function Cursor({ visible }: CursorProps) {
  const cursorStyle = useSettingsStore((s) => s.cursorStyle);

  const styleMap = {
    line: "w-0.5 h-[1.2em] align-middle -ml-0.5",
    block:
      "w-[1ch] h-[1.18em] align-middle -ml-[1ch] rounded-[3px] border border-[color-mix(in_srgb,var(--theme-cursor)_70%,transparent)] bg-[color-mix(in_srgb,var(--theme-cursor)_26%,transparent)]",
    underline: "w-[1ch] h-[2px] align-bottom -ml-[1ch]",
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
