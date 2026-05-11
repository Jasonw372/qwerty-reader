import type { Article } from "../../types/index.ts";

interface ReadingPreviewProps {
  article: Article;
  phase: "ready" | "reading";
  onStartReading: () => void;
  onStartTyping: () => void;
}

function splitParagraphs(content: string): string[] {
  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function ReadingPreview({
  article,
  phase,
  onStartReading,
  onStartTyping,
}: ReadingPreviewProps) {
  const paragraphs = splitParagraphs(article.content);
  const chars = article.content.trim().length;

  if (phase === "ready") {
    return (
      <section className="animate-float-in mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-5xl flex-col justify-center px-5 py-16 text-[var(--theme-text-correct)] md:px-8">
        <div className="glass-panel rounded-3xl px-6 py-8 md:px-10 md:py-10">
          <p className="mb-3 text-xs uppercase tracking-[0.22em] text-[var(--theme-accent)]">
            阅读预览
          </p>
          <h1 className="max-w-3xl text-4xl font-medium leading-tight md:text-6xl">
            {article.title}
          </h1>
          <div className="mt-6 flex flex-wrap gap-3 text-xs text-[var(--theme-text-muted)]">
            {article.source && (
              <span className="soft-button rounded-full px-3 py-1">{article.source}</span>
            )}
            <span className="soft-button rounded-full px-3 py-1">
              {paragraphs.length} paragraphs
            </span>
            <span className="soft-button rounded-full px-3 py-1">{chars} chars</span>
          </div>
          <button
            type="button"
            onClick={onStartReading}
            className="primary-button mt-10 w-fit rounded-xl px-6 py-3 text-sm cursor-pointer"
          >
            开始阅读
          </button>
        </div>
      </section>
    );
  }

  return (
    <article className="animate-float-in mx-auto w-full max-w-5xl px-5 pb-24 pt-12 text-[var(--theme-text-correct)] md:px-8 md:pt-16">
      <header className="glass-panel sticky top-[4.75rem] z-[1] mb-10 rounded-2xl px-5 py-5 md:px-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--theme-accent)]">
              通读文章
            </p>
            <h1 className="mt-2 text-3xl font-medium leading-tight md:text-4xl">{article.title}</h1>
          </div>
          <button
            type="button"
            onClick={onStartTyping}
            className="primary-button w-fit rounded-xl px-5 py-2.5 text-sm cursor-pointer"
          >
            开始打字
          </button>
        </div>
      </header>

      <div className="hairline-panel rounded-3xl px-6 py-8 md:px-10 md:py-10">
        <div className="space-y-7 text-lg leading-9 text-[var(--theme-text-pending)]">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
    </article>
  );
}
