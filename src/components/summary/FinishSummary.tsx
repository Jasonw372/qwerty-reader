import { useMemo } from "react";
import { formatTime } from "../../lib/textParser.ts";
import { useTypingStore } from "../../store/typingStore.ts";
import type { Keystroke } from "../../types/index.ts";
import { useTranslation } from "react-i18next";

interface ErrorItem {
  label: string;
  count: number;
}

interface HeatmapItem extends ErrorItem {
  total: number;
}

interface ParagraphPoint {
  label: string;
  wpm: number;
}

function labelChar(char: string): string {
  if (char === " ") return "Space";
  if (char === "\n") return "Enter";
  if (char === "\t") return "Tab";
  return char;
}

function rankErrors(keystrokes: Keystroke[], field: "expected" | "input", limit = 8): ErrorItem[] {
  const counts = new Map<string, number>();
  keystrokes
    .filter((k) => k.action === "type" && !k.correct)
    .forEach((k) => {
      const key = labelChar(k[field]);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function buildHeatmap(keystrokes: Keystroke[]): HeatmapItem[] {
  const total = new Map<string, number>();
  const wrong = new Map<string, number>();

  keystrokes
    .filter((k) => k.action === "type")
    .forEach((k) => {
      const key = labelChar(k.expected);
      total.set(key, (total.get(key) ?? 0) + 1);
      if (!k.correct) wrong.set(key, (wrong.get(key) ?? 0) + 1);
    });

  return [...wrong.entries()]
    .map(([label, count]) => ({ label, count, total: total.get(label) ?? count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 18);
}

function buildParagraphPoints(keystrokes: Keystroke[], paragraphCount: number): ParagraphPoint[] {
  return Array.from({ length: paragraphCount }, (_, index) => {
    const strokes = keystrokes.filter((k) => k.action === "type" && k.paragraphIndex === index);
    const first = strokes[0]?.timestamp;
    const last = strokes.at(-1)?.timestamp;
    const correct = strokes.filter((k) => k.correct).length;
    const elapsedMinutes = first && last ? Math.max((last - first) / 60_000, 1 / 60) : 1 / 60;

    return {
      label: `P${index + 1}`,
      wpm: Math.round(correct / 5 / elapsedMinutes),
    };
  });
}

function localizeKeyLabel(label: string, t: (key: string) => string): string {
  if (label === "Space") return t("summary.keySpace");
  if (label === "Enter") return t("summary.keyEnter");
  if (label === "Tab") return t("summary.keyTab");
  return label;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="hairline-panel rounded-2xl px-5 py-4">
      <div className="text-xs uppercase tracking-[0.18em] text-[var(--theme-text-pending)]">
        {label}
      </div>
      <div className="mt-2 text-4xl font-medium text-[var(--theme-text-correct)]">{value}</div>
    </div>
  );
}

export function FinishSummary() {
  const { t } = useTranslation();
  const isFinished = useTypingStore((s) => s.isFinished);
  const wpm = useTypingStore((s) => s.wpm);
  const accuracy = useTypingStore((s) => s.accuracy);
  const elapsed = useTypingStore((s) => s.elapsed);
  const keystrokes = useTypingStore((s) => s.keystrokes);
  const paragraphs = useTypingStore((s) => s.paragraphs);
  const reset = useTypingStore((s) => s.reset);

  const summary = useMemo(() => {
    const expectedErrors = rankErrors(keystrokes, "expected");
    const inputErrors = rankErrors(keystrokes, "input");
    const heatmap = buildHeatmap(keystrokes);
    const paragraphPoints = buildParagraphPoints(keystrokes, paragraphs.length);
    const maxParagraphWpm = Math.max(...paragraphPoints.map((p) => p.wpm), 1);

    return { expectedErrors, inputErrors, heatmap, paragraphPoints, maxParagraphWpm };
  }, [keystrokes, paragraphs.length]);

  if (!isFinished) return null;

  const width = 560;
  const height = 128;
  const padding = 18;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;
  const pointCount = summary.paragraphPoints.length;
  const points = summary.paragraphPoints.map((point, index) => {
    const x = pointCount <= 1 ? width / 2 : padding + (index / (pointCount - 1)) * plotWidth;
    const y = height - padding - (point.wpm / summary.maxParagraphWpm) * plotHeight;
    return { ...point, x, y };
  });
  const path = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <section className="animate-float-in mx-auto w-full max-w-6xl px-5 pb-24 pt-16 text-[var(--theme-text-correct)] md:px-8 md:pt-20">
      <div className="mb-8 flex flex-col gap-4 border-b border-[var(--theme-border)] pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--theme-accent)]">
            {t("summary.practiceComplete")}
          </p>
          <h1 className="mt-3 text-4xl font-medium tracking-normal md:text-5xl">
            {t("summary.title")}
          </h1>
        </div>
        <button
          type="button"
          onClick={reset}
          className="primary-button w-fit rounded-xl px-5 py-2.5 text-sm cursor-pointer"
        >
          {t("summary.retry")}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric label={t("summary.finalWpm")} value={wpm} />
        <Metric label={t("summary.accuracy")} value={`${accuracy}%`} />
        <Metric label={t("summary.totalTime")} value={formatTime(elapsed)} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div className="glass-panel rounded-2xl p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-medium">{t("summary.errorHeatmap")}</h2>
            <span className="text-xs text-[var(--theme-text-pending)]">
              {t("summary.errors", {
                count: keystrokes.filter((k) => k.action === "type" && !k.correct).length,
              })}
            </span>
          </div>

          {summary.heatmap.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {summary.heatmap.map((item) => {
                const intensity = Math.max(
                  0.16,
                  item.count / Math.max(summary.heatmap[0].count, 1),
                );
                return (
                  <div
                    key={item.label}
                    className="min-w-14 rounded-xl border border-[var(--theme-border)] px-3 py-2 text-center shadow-sm"
                    style={{
                      backgroundColor: `rgba(247, 118, 142, ${intensity})`,
                    }}
                    title={`${localizeKeyLabel(item.label, t)}: ${item.count}/${item.total}`}
                  >
                    <div className="text-lg">{localizeKeyLabel(item.label, t)}</div>
                    <div className="text-xs text-[var(--theme-text-pending)]">{item.count}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[var(--theme-text-pending)]">{t("summary.noErrors")}</p>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <ErrorRank title={t("summary.expectedErrors")} items={summary.expectedErrors} />
            <ErrorRank title={t("summary.inputErrors")} items={summary.inputErrors} />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-medium">{t("summary.paragraphTrend")}</h2>
            <span className="text-xs text-[var(--theme-text-pending)]">
              {t("summary.wpmPerParagraph")}
            </span>
          </div>

          <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={t("summary.paragraphTrendAria")}
            className="h-40 w-full overflow-visible"
          >
            <line
              x1={padding}
              x2={width - padding}
              y1={height - padding}
              y2={height - padding}
              stroke="var(--theme-border)"
            />
            {points.map((point) => (
              <line
                key={point.label}
                x1={point.x}
                x2={point.x}
                y1={height - padding}
                y2={point.y}
                stroke="var(--theme-border)"
                strokeWidth="1"
              />
            ))}
            {points.length > 1 && (
              <polyline
                fill="none"
                points={path}
                stroke="var(--theme-cursor)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />
            )}
            {points.map((point) => (
              <g key={point.label}>
                <circle cx={point.x} cy={point.y} fill="var(--theme-cursor)" r="4" />
                <text
                  x={point.x}
                  y={point.y - 10}
                  fill="var(--theme-text-correct)"
                  fontSize="12"
                  textAnchor="middle"
                >
                  {point.wpm}
                </text>
                <text
                  x={point.x}
                  y={height - 2}
                  fill="var(--theme-text-pending)"
                  fontSize="11"
                  textAnchor="middle"
                >
                  {point.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}

function ErrorRank({ title, items }: { title: string; items: ErrorItem[] }) {
  const { t } = useTranslation();

  return (
    <div>
      <h3 className="mb-2 text-xs uppercase tracking-wider text-[var(--theme-text-pending)]">
        {title}
      </h3>
      {items.length > 0 ? (
        <ol className="space-y-1 text-sm">
          {items.slice(0, 5).map((item) => (
            <li
              key={item.label}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--theme-border)] px-3 py-2"
            >
              <span className="truncate text-[var(--theme-text-correct)]">
                {localizeKeyLabel(item.label, t)}
              </span>
              <span className="text-[var(--theme-text-error)]">{item.count}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-[var(--theme-text-pending)]">{t("summary.none")}</p>
      )}
    </div>
  );
}
