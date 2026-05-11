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
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-4xl flex-col justify-center px-8 py-16 text-[var(--theme-text-correct)]">
        <p className="mb-3 text-sm text-[var(--theme-text-pending)]">阅读预览</p>
        <h1 className="text-4xl font-medium leading-tight">{article.title}</h1>
        <div className="mt-5 flex gap-4 text-xs text-[var(--theme-text-muted)]">
          {article.source && <span>{article.source}</span>}
          <span>{paragraphs.length} paragraphs</span>
          <span>{chars} chars</span>
        </div>
        <button
          type="button"
          onClick={onStartReading}
          className="mt-10 w-fit border border-[var(--theme-text-correct)] bg-transparent px-6 py-2.5 text-sm text-[var(--theme-text-correct)] transition-colors hover:bg-[var(--theme-text-correct)] hover:text-[var(--theme-bg)]"
        >
          开始阅读
        </button>
      </section>
    );
  }

  return (
    <article className="mx-auto w-full max-w-4xl px-8 pb-24 pt-16 text-[var(--theme-text-correct)]">
      <header className="sticky top-[3.25rem] z-[1] -mx-8 mb-10 border-b border-[var(--theme-border)] bg-[var(--theme-bg)]/90 px-8 pb-5 pt-2 backdrop-blur-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm text-[var(--theme-text-pending)]">通读文章</p>
            <h1 className="mt-2 text-3xl font-medium leading-tight">{article.title}</h1>
          </div>
          <button
            type="button"
            onClick={onStartTyping}
            className="w-fit border border-[var(--theme-text-correct)] bg-transparent px-5 py-2 text-sm text-[var(--theme-text-correct)] transition-colors hover:bg-[var(--theme-text-correct)] hover:text-[var(--theme-bg)]"
          >
            开始打字
          </button>
        </div>
      </header>

      <div className="space-y-7 text-lg leading-9 text-[var(--theme-text-pending)]">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
