import { useTypingStore } from "../../store/typingStore.ts";
import { useArticleStore } from "../../store/articleStore.ts";
import { useSettingsStore } from "../../store/settingsStore.ts";
import { formatTime } from "../../lib/textParser.ts";
import { BarChart3, ClipboardCheck, Eye, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { UserMenu } from "../auth/UserMenu.tsx";

interface HUDProps {
  onOpenReading?: () => void;
  onOpenHistory?: () => void;
  onOpenReview?: () => void;
}

export function HUD({ onOpenReading, onOpenHistory, onOpenReview }: HUDProps) {
  const { t } = useTranslation();
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
    <header className="hud-shell font-mono">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:gap-6 md:px-8">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 md:max-w-[26rem]">
          <button
            onClick={openManager}
            title={t("hud.manageArticles")}
            className="hud-prompt-button cursor-pointer"
          >
            <span className="hud-prompt-caret">▸</span>
            <span className="hud-prompt-title truncate text-sm">
              {article?.title ?? t("hud.noArticle")}
            </span>
          </button>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[var(--theme-text-muted)]">
            <div className="hud-progress-track flex-1">
              <div className="hud-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="tabular-nums text-[var(--theme-text-pending)]">{progress}%</span>
          </div>
        </div>

        <div className="hud-divider-vert hidden md:block" />

        <div className="flex items-center justify-between gap-3 md:flex-1 md:justify-start md:gap-4">
          <div className="hud-stat-group">
            <div className={`hud-stat hud-stat-primary ${isFinished ? "is-finished" : ""}`}>
              <span className="hud-stat-label">WPM</span>
              <span className={`hud-stat-value ${isFinished ? "animate-pop-in" : ""}`}>{wpm}</span>
            </div>
            <div className="hud-stat">
              <span className="hud-stat-label">ACC</span>
              <span className="hud-stat-value">{accuracy}%</span>
            </div>
            <div className="hud-stat">
              <span className="hud-stat-label">TIME</span>
              <span className="hud-stat-value">{formatTime(elapsed)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:hidden">
            <ToolButtons
              onOpenReading={onOpenReading}
              onOpenHistory={onOpenHistory}
              onOpenReview={onOpenReview}
              onOpenSettings={openSettings}
            />
          </div>
        </div>

        <div className="hud-divider-vert hidden md:block" />

        <div className="hidden items-center gap-1.5 md:flex">
          <ToolButtons
            onOpenReading={onOpenReading}
            onOpenHistory={onOpenHistory}
            onOpenReview={onOpenReview}
            onOpenSettings={openSettings}
          />
        </div>
      </div>
    </header>
  );
}

interface ToolButtonsProps {
  onOpenReading?: () => void;
  onOpenHistory?: () => void;
  onOpenReview?: () => void;
  onOpenSettings: () => void;
}

function ToolButtons({
  onOpenReading,
  onOpenHistory,
  onOpenReview,
  onOpenSettings,
}: ToolButtonsProps) {
  const { t } = useTranslation();

  return (
    <>
      {onOpenReading && (
        <button
          onClick={onOpenReading}
          title={t("hud.readingPreview")}
          aria-label={t("hud.readingPreview")}
          className="icon-button grid size-9 place-items-center rounded-lg cursor-pointer"
        >
          <Eye size={18} />
        </button>
      )}

      <UserMenu />

      {onOpenHistory && (
        <button
          onClick={onOpenHistory}
          title={t("hud.history")}
          className="icon-button grid size-9 place-items-center rounded-lg cursor-pointer"
          aria-label={t("hud.historyAria")}
        >
          <BarChart3 size={18} />
        </button>
      )}

      {onOpenReview && (
        <button
          onClick={onOpenReview}
          title={t("hud.review")}
          className="icon-button grid size-9 place-items-center rounded-lg cursor-pointer"
          aria-label={t("hud.reviewAria")}
        >
          <ClipboardCheck size={18} />
        </button>
      )}

      <button
        onClick={onOpenSettings}
        title={t("hud.settings")}
        className="icon-button grid size-9 place-items-center rounded-lg cursor-pointer"
        aria-label={t("hud.settingsAria")}
      >
        <Settings size={18} />
      </button>
    </>
  );
}
