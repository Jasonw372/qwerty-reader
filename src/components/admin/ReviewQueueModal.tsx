import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  fetchPendingPublicArticles,
  fetchPublicArticles,
  reviewPublicArticle,
} from "../../lib/sync.ts";
import type { Article } from "../../types/index.ts";
import { ArticlePreviewModal } from "../articles/ArticlePreviewModal.tsx";

interface ReviewQueueModalProps {
  onClose: () => void;
}

export function ReviewQueueModal({ onClose }: ReviewQueueModalProps) {
  const { t } = useTranslation();
  const [pendingArticles, setPendingArticles] = useState<Article[]>([]);
  const [approvedArticles, setApprovedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);

  async function loadReviewData() {
    setLoading(true);
    setError("");
    try {
      const [pending, approved] = await Promise.all([
        fetchPendingPublicArticles(),
        fetchPublicArticles(),
      ]);
      setPendingArticles(pending);
      setApprovedArticles(approved);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("review.loadError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReviewData();
  }, []);

  async function handleReview(id: string, decision: "approved" | "rejected") {
    setReviewingId(id);
    setError("");
    const { error: reviewError } = await reviewPublicArticle(id, decision);
    setReviewingId(null);
    if (reviewError) {
      setError(reviewError);
      return;
    }
    await loadReviewData();
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="glass-panel relative flex max-h-[86vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl font-mono"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-[var(--theme-border)] px-6 py-5">
            <div>
              <span className="text-base font-medium text-[var(--theme-text-correct)]">
                {t("review.title")}
              </span>
              <p className="mt-1 text-xs text-[var(--theme-text-muted)]">{t("review.subtitle")}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void loadReviewData()}
                className="icon-button grid size-9 place-items-center rounded-lg cursor-pointer"
                aria-label={t("review.refresh")}
                title={t("review.refresh")}
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : undefined} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="icon-button grid size-9 place-items-center rounded-lg cursor-pointer"
                aria-label={t("review.close")}
                title={t("review.close")}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="grid flex-1 gap-6 overflow-y-auto px-6 py-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs uppercase tracking-[0.16em] text-[var(--theme-text-pending)]">
                  {t("review.pending")}
                </h2>
                <span className="text-xs text-[var(--theme-text-muted)]">
                  {pendingArticles.length}
                </span>
              </div>

              {error && (
                <p className="rounded-xl border border-[var(--theme-border)] px-3 py-2 text-xs text-[var(--theme-text-error)]">
                  {error}
                </p>
              )}

              {loading && pendingArticles.length === 0 ? (
                <ReviewSkeleton />
              ) : pendingArticles.length === 0 ? (
                <p className="rounded-xl border border-[var(--theme-border)] px-4 py-8 text-center text-sm text-[var(--theme-text-pending)]">
                  {t("review.empty")}
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {pendingArticles.map((article) => (
                    <ReviewArticleItem
                      key={article.id}
                      article={article}
                      busy={reviewingId === article.id}
                      onPreview={() => setPreviewArticle(article)}
                      onApprove={() => void handleReview(article.id, "approved")}
                      onReject={() => void handleReview(article.id, "rejected")}
                    />
                  ))}
                </ul>
              )}
            </section>

            <aside className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs uppercase tracking-[0.16em] text-[var(--theme-text-pending)]">
                  {t("review.approved")}
                </h2>
                <span className="text-xs text-[var(--theme-text-muted)]">
                  {approvedArticles.length}
                </span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-[var(--theme-border)]">
                {approvedArticles.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-[var(--theme-text-pending)]">
                    {loading ? t("review.loading") : t("review.noApproved")}
                  </p>
                ) : (
                  <ol className="max-h-[32rem] overflow-y-auto">
                    {approvedArticles.map((article) => (
                      <li
                        key={article.id}
                        className="flex items-center justify-between gap-3 border-b border-[var(--theme-border)] px-4 py-3 last:border-b-0"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm text-[var(--theme-text-correct)]">
                            {article.title}
                          </div>
                          <div className="mt-1 text-xs text-[var(--theme-text-muted)]">
                            {t("articlePreview.chars", { count: article.content.trim().length })}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewArticle(article)}
                          className="soft-button shrink-0 rounded-lg px-2.5 py-1 text-xs cursor-pointer"
                        >
                          {t("articlePreview.view")}
                        </button>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
      {previewArticle && (
        <ArticlePreviewModal article={previewArticle} onClose={() => setPreviewArticle(null)} />
      )}
    </>
  );
}

function ReviewArticleItem({
  article,
  busy,
  onPreview,
  onApprove,
  onReject,
}: {
  article: Article;
  busy: boolean;
  onPreview: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { t } = useTranslation();
  const charCount = article.content.trim().length;

  return (
    <li className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-elevated)] px-4 py-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-base font-medium text-[var(--theme-text-correct)]">
            {article.title}
          </h3>
          <p className="mt-1 truncate text-sm text-[var(--theme-text-pending)]">
            {article.content}
          </p>
          <div className="mt-2 text-[10px] uppercase tracking-[0.12em] text-[var(--theme-text-muted)]">
            {t("articlePreview.chars", { count: charCount })}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onPreview}
            className="soft-button rounded-lg px-3 py-1.5 text-xs cursor-pointer"
          >
            {t("articlePreview.view")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onReject}
            className="soft-button rounded-lg px-3 py-1.5 text-xs cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("review.reject")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onApprove}
            className="primary-button rounded-lg px-3 py-1.5 text-xs cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("review.approve")}
          </button>
        </div>
      </div>
    </li>
  );
}

function ReviewSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface-elevated)] px-4 py-4"
        >
          <div className="h-5 w-48 animate-pulse rounded-full bg-[color-mix(in_srgb,var(--theme-text-pending)_18%,transparent)]" />
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full animate-pulse rounded-full bg-[color-mix(in_srgb,var(--theme-text-pending)_14%,transparent)]" />
            <div className="h-3 w-5/6 animate-pulse rounded-full bg-[color-mix(in_srgb,var(--theme-text-pending)_14%,transparent)]" />
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-[color-mix(in_srgb,var(--theme-text-pending)_14%,transparent)]" />
          </div>
        </div>
      ))}
    </div>
  );
}
