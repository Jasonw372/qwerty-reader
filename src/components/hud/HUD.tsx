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
  const openManager = useArticleStore((s) => s.openManager);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);

  const progress =
    paragraphs.length > 0 ? Math.round((activeParagraphIndex / paragraphs.length) * 100) : 0;

  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between px-8 py-3 text-sm font-mono backdrop-blur-sm"
      style={{ backgroundColor: "var(--theme-hud-bg)" }}
    >
      <div className="flex items-center gap-4 text-[var(--theme-text-pending)]">
        <button
          onClick={openManager}
          title="管理文章"
          className="max-w-xs truncate px-2 py-0.5 rounded border border-[var(--theme-border)] text-[var(--theme-text-correct)] hover:border-[var(--theme-text-correct)] transition-colors bg-transparent text-xs cursor-pointer"
        >
          {article?.title ?? "—"}
        </button>
        <span>{progress}%</span>
      </div>

      <div className="flex items-center gap-6 text-[var(--theme-text-pending)]">
        <span>
          WPM: <span className="text-[var(--theme-text-correct)]">{wpm}</span>
        </span>
        <span>
          ACC: <span className="text-[var(--theme-text-correct)]">{accuracy}%</span>
        </span>
        <span className="text-[var(--theme-text-correct)]">{formatTime(elapsed)}</span>

        <button
          onClick={() => setTheme(theme === "dark" ? "parchment" : "dark")}
          title={theme === "dark" ? "切换到羊皮纸模式" : "切换到暗黑模式"}
          className="px-2 py-0.5 rounded border border-[var(--theme-border)] text-[var(--theme-text-pending)] hover:text-[var(--theme-text-correct)] hover:border-[var(--theme-text-correct)] transition-colors bg-transparent text-xs cursor-pointer"
        >
          {theme === "dark" ? "☀ light" : "☾ dark"}
        </button>

        <button
          onClick={toggleSound}
          title={soundEnabled ? "关闭音效" : "开启音效"}
          className={`px-2 py-0.5 rounded border border-[var(--theme-border)] hover:border-[var(--theme-text-correct)] transition-colors bg-transparent text-xs cursor-pointer ${
            soundEnabled ? "text-[var(--theme-text-correct)]" : "text-[var(--theme-text-pending)]"
          }`}
        >
          {soundEnabled ? "♪ on" : "♪ off"}
        </button>
      </div>
    </header>
  );
}
