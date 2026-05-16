import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Article } from "../../types/index.ts";

interface ArticlePreviewModalProps {
  article: Article;
  primaryActionLabel?: string;
  onPrimary?: () => void;
  onClose: () => void;
}

export function ArticlePreviewModal({
  article,
  primaryActionLabel,
  onPrimary,
  onClose,
}: ArticlePreviewModalProps) {
  const { t } = useTranslation();
  const charCount = article.content.trim().length;
  const paragraphs = article.content.split(/\n{2,}/).filter((p) => p.trim().length > 0).length;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-panel flex h-[82vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--theme-border)] px-6 py-5">
          <div className="min-w-0">
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[var(--theme-accent)]">
              {t("articlePreview.title")}
            </p>
            <h2 className="truncate text-xl font-medium text-[var(--theme-text-correct)]">
              {article.title}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--theme-text-muted)]">
              {article.source && (
                <span className="rounded-full border border-[var(--theme-border)] px-2.5 py-1">
                  {article.source}
                </span>
              )}
              <span className="rounded-full border border-[var(--theme-border)] px-2.5 py-1">
                {t("articlePreview.chars", { count: charCount })}
              </span>
              <span className="rounded-full border border-[var(--theme-border)] px-2.5 py-1">
                {t("articlePreview.paragraphs", { count: paragraphs })}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-button grid size-9 shrink-0 place-items-center rounded-lg cursor-pointer"
            aria-label={t("articlePreview.close")}
            title={t("articlePreview.close")}
          >
            <X size={16} />
          </button>
        </header>

        <article className="flex-1 overflow-y-auto px-6 py-5">
          <div className="whitespace-pre-wrap text-sm leading-8 text-[var(--theme-text-pending)]">
            {article.content}
          </div>
        </article>

        {primaryActionLabel && onPrimary && (
          <footer className="flex justify-end border-t border-[var(--theme-border)] px-6 py-4">
            <button
              type="button"
              onClick={onPrimary}
              className="primary-button rounded-xl px-5 py-2 text-sm cursor-pointer"
            >
              {primaryActionLabel}
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
