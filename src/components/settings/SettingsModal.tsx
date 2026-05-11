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
    { key: "auto", label: "跟随系统" },
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={closeSettings}
    >
      <div
        className="glass-panel relative flex max-h-[82vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--theme-border)] px-6 py-5">
          <div>
            <span className="text-base font-medium text-[var(--theme-text-correct)]">设置</span>
            <p className="mt-1 text-xs text-[var(--theme-text-muted)]">外观、声音和输入反馈</p>
          </div>
          <button
            onClick={closeSettings}
            className="icon-button rounded-lg px-3 py-1.5 text-xs cursor-pointer"
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
                  className={`flex-1 rounded-xl border py-2 text-xs cursor-pointer transition-colors ${
                    theme === key
                      ? "border-[var(--theme-border-strong)] bg-[var(--theme-accent-soft)] text-[var(--theme-text-correct)]"
                      : "border-[var(--theme-border)] text-[var(--theme-text-pending)] hover:border-[var(--theme-text-pending)]"
                  }`}
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
              className="h-2 w-full cursor-pointer accent-[var(--theme-cursor)]"
            />
            <div className="flex justify-between text-xs text-[var(--theme-text-muted)]">
              <span>14px</span>
              <span>40px</span>
            </div>
          </div>

          {/* Sound */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-[var(--theme-text-muted)]">音效</label>
            <button
              onClick={toggleSound}
              className={`relative h-6 w-12 rounded-full border transition-colors cursor-pointer ${
                soundEnabled
                  ? "border-[var(--theme-text-correct)] bg-[var(--theme-text-correct)]/20"
                  : "border-[var(--theme-border)] bg-transparent"
              }`}
              aria-label="切换音效"
            >
              <span
                className={`absolute top-0.5 size-5 rounded-full transition-all ${
                  soundEnabled
                    ? "left-[calc(100%-1.375rem)] bg-[var(--theme-text-correct)]"
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
                  className={`flex flex-1 flex-col items-center gap-1 rounded-xl border py-2 text-xs cursor-pointer transition-colors ${
                    cursorStyle === key
                      ? "border-[var(--theme-border-strong)] bg-[var(--theme-accent-soft)] text-[var(--theme-text-correct)]"
                      : "border-[var(--theme-border)] text-[var(--theme-text-pending)] hover:border-[var(--theme-text-pending)]"
                  }`}
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
