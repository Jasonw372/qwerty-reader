import { useTypingStore } from "../../store/typingStore.ts";
import { useArticleStore } from "../../store/articleStore.ts";
import { useSettingsStore } from "../../store/settingsStore.ts";
import { formatTime } from "../../lib/textParser.ts";
import { BarChart3, ClipboardCheck, Settings } from "lucide-react";
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
    <header
      className="fixed inset-x-0 top-0 z-40 border-b border-[var(--theme-border)] px-4 py-3 font-mono backdrop-blur-xl md:px-8"
      style={{ backgroundColor: "var(--theme-hud-bg)" }}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3 text-[var(--theme-text-pending)]">
          <button
            onClick={openManager}
            title={t("hud.manageArticles")}
            className="soft-button min-w-0 max-w-[min(22rem,62vw)] truncate rounded-lg px-3 py-2 text-left text-xs cursor-pointer"
          >
            <span className="mr-2 text-[var(--theme-accent)]">▸</span>
            <span className="text-[var(--theme-text-correct)]">
              {article?.title ?? t("hud.noArticle")}
            </span>
          </button>
          <div className="hidden h-8 w-px bg-[var(--theme-border)] md:block" />
          <div className="flex min-w-28 flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">
              <span>{t("hud.progress")}</span>
              <span className="tracking-normal text-[var(--theme-text-pending)]">{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--theme-border)]">
              <div
                className="h-full rounded-full bg-[var(--theme-cursor)] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[var(--theme-text-pending)] md:justify-end">
          <Stat label="WPM" value={wpm} />
          <Stat label="ACC" value={`${accuracy}%`} />
          <Stat label="TIME" value={formatTime(elapsed)} />

          {onOpenReading && (
            <button
              onClick={onOpenReading}
              title={t("hud.readingPreview")}
              className="soft-button rounded-lg px-3 py-2 text-xs cursor-pointer"
            >
              {t("hud.reading")}
            </button>
          )}

          <UserMenu />

          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              title={t("hud.history")}
              className="icon-button grid size-10 place-items-center rounded-lg cursor-pointer"
              aria-label={t("hud.historyAria")}
            >
              <BarChart3 size={20} />
            </button>
          )}

          {onOpenReview && (
            <button
              onClick={onOpenReview}
              title={t("hud.review")}
              className="icon-button grid size-10 place-items-center rounded-lg cursor-pointer"
              aria-label={t("hud.reviewAria")}
            >
              <ClipboardCheck size={20} />
            </button>
          )}

          <button
            onClick={openSettings}
            title={t("hud.settings")}
            className="icon-button grid size-10 place-items-center rounded-lg cursor-pointer"
            aria-label={t("hud.settingsAria")}
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-elevated)] px-3 py-1.5 shadow-sm">
      <span className="mr-2 text-[10px] uppercase tracking-[0.16em] text-[var(--theme-text-muted)]">
        {label}
      </span>
      <span className="text-sm font-medium text-[var(--theme-text-correct)]">{value}</span>
    </div>
  );
}
