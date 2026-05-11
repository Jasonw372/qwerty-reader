import { useTypingStore } from "../../store/typingStore.ts";
import { useArticleStore } from "../../store/articleStore.ts";
import { useSettingsStore } from "../../store/settingsStore.ts";
import { formatTime } from "../../lib/textParser.ts";

interface HUDProps {
  onOpenReading?: () => void;
}

export function HUD({ onOpenReading }: HUDProps) {
  const wpm = useTypingStore((s) => s.wpm);
  const accuracy = useTypingStore((s) => s.accuracy);
  const elapsed = useTypingStore((s) => s.elapsed);
  const paragraphs = useTypingStore((s) => s.paragraphs);
  const activeParagraphIndex = useTypingStore((s) => s.activeParagraphIndex);
  const isFinished = useTypingStore((s) => s.isFinished);
  const article = useArticleStore((s) => s.currentArticle);
  const openManager = useArticleStore((s) => s.openManager);
  const openSettings = useSettingsStore((s) => s.openSettings);

  const progress =
    paragraphs.length > 0
      ? isFinished
        ? 100
        : Math.round((activeParagraphIndex / paragraphs.length) * 100)
      : 0;

  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between px-8 py-3 text-sm font-mono backdrop-blur-sm"
      style={{ backgroundColor: "var(--theme-hud-bg)" }}
    >
      <div className="flex items-center gap-4 text-[var(--theme-text-pending)]">
        <button
          onClick={openManager}
          title="管理文章 (Tab)"
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

        {onOpenReading && (
          <button
            onClick={onOpenReading}
            title="阅读预览"
            className="px-2 py-0.5 rounded border border-[var(--theme-border)] text-[var(--theme-text-pending)] hover:text-[var(--theme-text-correct)] hover:border-[var(--theme-text-correct)] transition-colors bg-transparent text-xs cursor-pointer"
          >
            阅读
          </button>
        )}

        <button
          onClick={openSettings}
          title="设置"
          className="px-2 py-0.5 rounded border border-[var(--theme-border)] text-[var(--theme-text-pending)] hover:text-[var(--theme-text-correct)] hover:border-[var(--theme-text-correct)] transition-colors bg-transparent text-xs cursor-pointer"
        >
          ⚙ settings
        </button>
      </div>
    </header>
  );
}
