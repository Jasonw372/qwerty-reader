import { useSettingsStore } from "../../store/settingsStore.ts";
import type { Theme, CursorStyle } from "../../types/index.ts";

export function SettingsModal() {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const setFontSize = useSettingsStore((s) => s.setFontSize);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);
  const cursorStyle = useSettingsStore((s) => s.cursorStyle);
  const setCursorStyle = useSettingsStore((s) => s.setCursorStyle);
  const closeSettings = useSettingsStore((s) => s.closeSettings);

  const themes: { key: Theme; label: string }[] = [
    { key: "dark", label: "Tokyo Night" },
    { key: "parchment", label: "Parchment" },
  ];

  const cursors: { key: CursorStyle; label: string; preview: string }[] = [
    { key: "line", label: "竖线", preview: "|" },
    { key: "block", label: "块状", preview: "█" },
    { key: "underline", label: "下划线", preview: "_" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={closeSettings}
    >
      <div
        className="relative w-full max-w-lg mx-4 rounded-xl font-mono overflow-hidden flex flex-col max-h-[80vh] border border-[var(--theme-border)]"
        style={{ backgroundColor: "var(--theme-bg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--theme-border)]">
          <span className="text-sm font-medium text-[var(--theme-text-correct)]">设置</span>
          <button
            onClick={closeSettings}
            className="text-xs px-2 py-1 rounded border border-[var(--theme-border)] text-[var(--theme-text-pending)] hover:text-[var(--theme-text-correct)] hover:border-[var(--theme-text-correct)] transition-colors bg-transparent cursor-pointer"
          >
            Esc
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
          {/* Theme */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-[var(--theme-text-muted)]">主题</label>
            <div className="flex gap-2">
              {themes.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={`flex-1 py-2 rounded text-xs border transition-colors cursor-pointer ${
                    theme === key
                      ? "border-[var(--theme-text-correct)] text-[var(--theme-text-correct)]"
                      : "border-[var(--theme-border)] text-[var(--theme-text-pending)] hover:border-[var(--theme-text-pending)]"
                  }`}
                  style={{
                    backgroundColor: theme === key ? "var(--theme-hud-bg)" : "transparent",
                    fontFamily: "inherit",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Font size */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[var(--theme-text-muted)]">字体大小</label>
              <span className="text-xs text-[var(--theme-text-correct)]">{fontSize}px</span>
            </div>
            <input
              type="range"
              min={14}
              max={40}
              step={1}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-[var(--theme-cursor)] cursor-pointer"
            />
            <div className="flex justify-between text-xs text-[var(--theme-text-muted)]">
              <span>14px</span>
              <span>50px</span>
            </div>
          </div>

          {/* Sound */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-[var(--theme-text-muted)]">音效</label>
            <button
              onClick={toggleSound}
              className={`relative w-10 h-5 rounded-full border transition-colors cursor-pointer ${
                soundEnabled
                  ? "border-[var(--theme-text-correct)] bg-[var(--theme-text-correct)]/20"
                  : "border-[var(--theme-border)] bg-transparent"
              }`}
            >
              <span
                className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all ${
                  soundEnabled
                    ? "left-[calc(100%-1rem-2px)] bg-[var(--theme-text-correct)]"
                    : "left-0.5 bg-[var(--theme-text-muted)]"
                }`}
              />
            </button>
          </div>

          {/* Cursor style */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-[var(--theme-text-muted)]">光标样式</label>
            <div className="flex gap-2">
              {cursors.map(({ key, label, preview }) => (
                <button
                  key={key}
                  onClick={() => setCursorStyle(key)}
                  className={`flex-1 py-2 rounded text-xs border transition-colors cursor-pointer flex flex-col items-center gap-1 ${
                    cursorStyle === key
                      ? "border-[var(--theme-text-correct)] text-[var(--theme-text-correct)]"
                      : "border-[var(--theme-border)] text-[var(--theme-text-pending)] hover:border-[var(--theme-text-pending)]"
                  }`}
                  style={{
                    backgroundColor: cursorStyle === key ? "var(--theme-hud-bg)" : "transparent",
                    fontFamily: "inherit",
                  }}
                >
                  <span className="text-base leading-none">{preview}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
