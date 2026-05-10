import { useTypingStore } from "../../store/typingStore.ts";
import { useArticleStore } from "../../store/articleStore.ts";
import { useSettingsStore } from "../../store/settingsStore.ts";
import { formatTime } from "../../lib/textParser.ts";

export function HUD() {
  const wpm = useTypingStore((s) => s.wpm);
  const accuracy = useTypingStore((s) => s.accuracy);
  const elapsed = useTypingStore((s) => s.elapsed);
  const paragraphs = useTypingStore((s) => s.paragraphs);
  const activeParagraphIndex = useTypingStore((s) => s.activeParagraphIndex);
  const article = useArticleStore((s) => s.currentArticle);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);

  const progress =
    paragraphs.length > 0 ? Math.round((activeParagraphIndex / paragraphs.length) * 100) : 0;

  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between px-8 py-3 text-sm font-mono"
      style={{ backgroundColor: "var(--theme-hud-bg)", backdropFilter: "blur(8px)" }}
    >
      <div className="flex items-center gap-4" style={{ color: "var(--theme-text-pending)" }}>
        <span
          className="font-medium truncate max-w-xs"
          style={{ color: "var(--theme-text-correct)" }}
        >
          {article?.title ?? "—"}
        </span>
        <span>{progress}%</span>
      </div>

      <div className="flex items-center gap-6" style={{ color: "var(--theme-text-pending)" }}>
        <span>
          WPM: <span style={{ color: "var(--theme-text-correct)" }}>{wpm}</span>
        </span>
        <span>
          ACC: <span style={{ color: "var(--theme-text-correct)" }}>{accuracy}%</span>
        </span>
        <span style={{ color: "var(--theme-text-correct)" }}>{formatTime(elapsed)}</span>

        <button
          onClick={() => setTheme(theme === "dark" ? "parchment" : "dark")}
          title={theme === "dark" ? "切换到羊皮纸模式" : "切换到暗黑模式"}
          style={{
            background: "none",
            border: "1px solid var(--theme-border)",
            borderRadius: "6px",
            padding: "2px 8px",
            cursor: "pointer",
            color: "var(--theme-text-pending)",
            fontSize: "0.75rem",
            fontFamily: "inherit",
            transition: "color 0.2s, border-color 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--theme-text-correct)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--theme-text-correct)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--theme-text-pending)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--theme-border)";
          }}
        >
          {theme === "dark" ? "☀ light" : "☾ dark"}
        </button>

        <button
          onClick={toggleSound}
          title={soundEnabled ? "关闭音效" : "开启音效"}
          style={{
            background: "none",
            border: "1px solid var(--theme-border)",
            borderRadius: "6px",
            padding: "2px 8px",
            cursor: "pointer",
            color: soundEnabled ? "var(--theme-text-correct)" : "var(--theme-text-pending)",
            fontSize: "0.75rem",
            fontFamily: "inherit",
            transition: "color 0.2s, border-color 0.2s",
          }}
        >
          {soundEnabled ? "♪ on" : "♪ off"}
        </button>
      </div>
    </header>
  );
}
