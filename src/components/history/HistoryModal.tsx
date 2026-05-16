import { useEffect, useMemo, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useArticleStore } from "../../store/articleStore.ts";
import { fetchTypingSessions } from "../../lib/sync.ts";
import { formatTime } from "../../lib/textParser.ts";
import type { TypingSession } from "../../types/index.ts";

interface HistoryModalProps {
  onClose: () => void;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function topErrors(sessions: TypingSession[]): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>();
  for (const session of sessions) {
    for (const [label, count] of Object.entries(session.errorHeatmap)) {
      counts.set(label, (counts.get(label) ?? 0) + count);
    }
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label: label === " " ? "Space" : label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

export function HistoryModal({ onClose }: HistoryModalProps) {
  const { t } = useTranslation();
  const articles = useArticleStore((s) => s.articles);
  const articleTitles = useMemo(() => new Map(articles.map((a) => [a.id, a.title])), [articles]);
  const [sessions, setSessions] = useState<TypingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadSessions() {
    setLoading(true);
    setError(null);
    try {
      setSessions(await fetchTypingSessions(50));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("history.loadError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSessions();
  }, []);

  const stats = useMemo(() => {
    const bestWpm = Math.max(...sessions.map((s) => s.wpm), 0);
    const avgWpm = average(sessions.map((s) => s.wpm));
    const avgAccuracy = average(sessions.map((s) => s.accuracy));
    const totalChars = sessions.reduce((sum, session) => sum + session.totalChars, 0);
    const errors = topErrors(sessions);
    return { bestWpm, avgWpm, avgAccuracy, totalChars, errors };
  }, [sessions]);

  return (
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
              {t("history.title")}
            </span>
            <p className="mt-1 text-xs text-[var(--theme-text-muted)]">{t("history.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void loadSessions()}
              className="icon-button grid size-9 place-items-center rounded-lg cursor-pointer"
              aria-label={t("history.refresh")}
              title={t("history.refresh")}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : undefined} />
            </button>
            <button
              onClick={onClose}
              className="icon-button grid size-9 place-items-center rounded-lg cursor-pointer"
              aria-label={t("history.close")}
              title={t("history.close")}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && sessions.length === 0 ? (
            <HistorySkeleton />
          ) : error ? (
            <p className="rounded-xl border border-[var(--theme-border)] px-4 py-3 text-sm text-[var(--theme-text-error)]">
              {error}
            </p>
          ) : sessions.length === 0 ? (
            <p className="rounded-xl border border-[var(--theme-border)] px-4 py-8 text-center text-sm text-[var(--theme-text-pending)]">
              {t("history.empty")}
            </p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
              <aside className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Metric label={t("history.sessions")} value={sessions.length} />
                  <Metric label={t("history.bestWpm")} value={stats.bestWpm} />
                  <Metric label={t("history.avgWpm")} value={stats.avgWpm} />
                  <Metric label={t("history.avgAccuracy")} value={`${stats.avgAccuracy}%`} />
                </div>
                <div className="hairline-panel rounded-2xl px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-[var(--theme-text-pending)]">
                    {t("history.totalChars")}
                  </div>
                  <div className="mt-2 text-2xl font-medium text-[var(--theme-text-correct)]">
                    {stats.totalChars.toLocaleString()}
                  </div>
                </div>
                <div className="hairline-panel rounded-2xl px-4 py-4">
                  <div className="mb-3 text-xs uppercase tracking-[0.16em] text-[var(--theme-text-pending)]">
                    {t("history.commonErrors")}
                  </div>
                  {stats.errors.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {stats.errors.map((item) => (
                        <span
                          key={item.label}
                          className="rounded-lg border border-[var(--theme-border)] px-2 py-1 text-xs text-[var(--theme-text-correct)]"
                        >
                          {item.label} · {item.count}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--theme-text-pending)]">
                      {t("history.noErrors")}
                    </p>
                  )}
                </div>
              </aside>

              <div className="overflow-hidden rounded-2xl border border-[var(--theme-border)]">
                <div className="grid grid-cols-[1.2fr_0.7fr_0.7fr_0.8fr_0.8fr] gap-3 border-b border-[var(--theme-border)] bg-[var(--theme-surface-elevated)] px-4 py-3 text-xs uppercase tracking-[0.14em] text-[var(--theme-text-muted)]">
                  <span>{t("history.article")}</span>
                  <span>{t("history.wpm")}</span>
                  <span>{t("history.accuracy")}</span>
                  <span>{t("history.time")}</span>
                  <span>{t("history.date")}</span>
                </div>
                <ol className="max-h-[26rem] overflow-y-auto">
                  {sessions.map((session) => (
                    <li
                      key={session.id}
                      className="grid grid-cols-[1.2fr_0.7fr_0.7fr_0.8fr_0.8fr] gap-3 border-b border-[var(--theme-border)] px-4 py-3 text-sm last:border-b-0"
                    >
                      <span className="truncate text-[var(--theme-text-correct)]">
                        {session.articleId
                          ? (articleTitles.get(session.articleId) ?? t("history.deletedArticle"))
                          : t("history.presetArticle")}
                      </span>
                      <span className="text-[var(--theme-text-correct)]">{session.wpm}</span>
                      <span className="text-[var(--theme-text-pending)]">{session.accuracy}%</span>
                      <span className="text-[var(--theme-text-pending)]">
                        {formatTime(session.durationSeconds)}
                      </span>
                      <span className="truncate text-[var(--theme-text-muted)]">
                        {formatDate(session.createdAt)}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="hairline-panel rounded-2xl px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--theme-text-pending)]">
        {label}
      </div>
      <div className="mt-2 text-2xl font-medium text-[var(--theme-text-correct)]">{value}</div>
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr]" aria-hidden="true">
      <aside className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="hairline-panel rounded-2xl px-4 py-3">
              <SkeletonLine className="h-3 w-16" />
              <SkeletonLine className="mt-3 h-8 w-14" />
            </div>
          ))}
        </div>
        <div className="hairline-panel rounded-2xl px-4 py-4">
          <SkeletonLine className="h-3 w-28" />
          <SkeletonLine className="mt-3 h-8 w-24" />
        </div>
        <div className="hairline-panel rounded-2xl px-4 py-4">
          <SkeletonLine className="mb-4 h-3 w-24" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 7 }, (_, index) => (
              <SkeletonLine key={index} className="h-7 w-16 rounded-lg" />
            ))}
          </div>
        </div>
      </aside>

      <div className="overflow-hidden rounded-2xl border border-[var(--theme-border)]">
        <div className="grid grid-cols-[1.2fr_0.7fr_0.7fr_0.8fr_0.8fr] gap-3 border-b border-[var(--theme-border)] bg-[var(--theme-surface-elevated)] px-4 py-3">
          {Array.from({ length: 5 }, (_, index) => (
            <SkeletonLine key={index} className="h-3 w-16" />
          ))}
        </div>
        <div>
          {Array.from({ length: 8 }, (_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid grid-cols-[1.2fr_0.7fr_0.7fr_0.8fr_0.8fr] gap-3 border-b border-[var(--theme-border)] px-4 py-3 last:border-b-0"
            >
              <SkeletonLine className="h-5 w-full max-w-48" />
              <SkeletonLine className="h-5 w-10" />
              <SkeletonLine className="h-5 w-12" />
              <SkeletonLine className="h-5 w-14" />
              <SkeletonLine className="h-5 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonLine({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-full bg-[color-mix(in_srgb,var(--theme-text-pending)_18%,transparent)] ${className}`}
    />
  );
}
