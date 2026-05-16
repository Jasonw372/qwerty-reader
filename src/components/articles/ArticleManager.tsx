import { useEffect, useRef, useState } from "react";
import { useArticleStore } from "../../store/articleStore.ts";
import type { Article } from "../../types/index.ts";
import { useTranslation } from "react-i18next";
import { fetchPublicArticles } from "../../lib/sync.ts";
import { ArticlePreviewModal } from "./ArticlePreviewModal.tsx";

type Tab = "list" | "public" | "upload" | "input";

export function ArticleManager() {
  const { t } = useTranslation();
  const articles = useArticleStore((s) => s.articles);
  const currentArticle = useArticleStore((s) => s.currentArticle);
  const setCurrentArticle = useArticleStore((s) => s.setCurrentArticle);
  const addArticle = useArticleStore((s) => s.addArticle);
  const removeArticle = useArticleStore((s) => s.removeArticle);
  const restorePresets = useArticleStore((s) => s.restorePresets);
  const hiddenPresetCount = useArticleStore((s) => s.hiddenPresetIds.size);
  const closeManager = useArticleStore((s) => s.closeManager);

  const [tab, setTab] = useState<Tab>("list");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [inputError, setInputError] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadContent, setUploadContent] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadPublic, setUploadPublic] = useState(false);
  const [inputPublic, setInputPublic] = useState(false);
  const [publicArticles, setPublicArticles] = useState<Article[]>([]);
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicError, setPublicError] = useState("");
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadPublicArticles() {
    setPublicLoading(true);
    setPublicError("");
    try {
      setPublicArticles(await fetchPublicArticles());
    } catch (err) {
      setPublicError(err instanceof Error ? err.message : t("articleManager.publicLoadError"));
    } finally {
      setPublicLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "public") void loadPublicArticles();
  }, [tab]);

  function handleSelect(article: Article) {
    setCurrentArticle(article);
    closeManager();
  }

  function handleRemove(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    removeArticle(id);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setUploadTitle(file.name.replace(/\.txt$/i, ""));
      setUploadContent(text.trim());
      setUploadError("");
    };
    reader.readAsText(file, "utf-8");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleUploadSubmit() {
    if (!uploadTitle.trim()) {
      setUploadError(t("articleManager.errorTitleRequired"));
      return;
    }
    if (!uploadContent.trim()) {
      setUploadError(t("articleManager.errorSelectFile"));
      return;
    }
    const article: Article = {
      id: crypto.randomUUID(),
      title: uploadTitle.trim(),
      content: uploadContent,
      source: "upload",
      reviewStatus: uploadPublic ? "pending" : "private",
    };
    addArticle(article);
    setCurrentArticle(article);
    setUploadTitle("");
    setUploadContent("");
    setUploadError("");
    setUploadPublic(false);
    closeManager();
  }

  function handleInputSubmit() {
    if (!title.trim()) {
      setInputError(t("articleManager.errorTitleRequired"));
      return;
    }
    if (!content.trim()) {
      setInputError(t("articleManager.errorContentRequired"));
      return;
    }
    const article: Article = {
      id: crypto.randomUUID(),
      title: title.trim(),
      content: content.trim(),
      source: "manual",
      reviewStatus: inputPublic ? "pending" : "private",
    };
    addArticle(article);
    setCurrentArticle(article);
    setTitle("");
    setContent("");
    setInputError("");
    setInputPublic(false);
    closeManager();
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "list", label: t("articleManager.tabList") },
    { key: "public", label: t("articleManager.tabPublic") },
    { key: "upload", label: t("articleManager.tabUpload") },
    { key: "input", label: t("articleManager.tabInput") },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={closeManager}
    >
      <div
        className="glass-panel relative flex max-h-[82vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--theme-border)] px-6 py-5">
          <div>
            <span className="text-base font-medium text-[var(--theme-text-correct)]">
              {t("articleManager.title")}
            </span>
            <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
              {t("articleManager.availableArticles", { count: articles.length })}
            </p>
          </div>
          <button
            onClick={closeManager}
            className="icon-button rounded-lg px-3 py-1.5 text-xs cursor-pointer"
          >
            Esc
          </button>
        </div>

        <div className="flex gap-2 px-6 pt-5 text-xs">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-full border px-3 py-1.5 cursor-pointer transition-colors ${
                tab === key
                  ? "border-[var(--theme-border-strong)] bg-[var(--theme-accent-soft)] text-[var(--theme-text-correct)]"
                  : "border-[var(--theme-border)] text-[var(--theme-text-pending)] hover:text-[var(--theme-text-correct)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "list" && (
            <div className="flex flex-col gap-3">
              <ul className="flex flex-col gap-2">
                {articles.map((a) => (
                  <li
                    key={a.id}
                    onClick={() => handleSelect(a)}
                    className="flex items-center justify-between rounded-xl border border-[var(--theme-border)] px-4 py-3 cursor-pointer transition-all hover:-translate-y-0.5 hover:border-[var(--theme-border-strong)]"
                    style={{
                      backgroundColor:
                        a.id === currentArticle?.id ? "var(--theme-hud-bg)" : "transparent",
                    }}
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span
                        className="text-sm truncate"
                        style={{
                          color:
                            a.id === currentArticle?.id
                              ? "var(--theme-text-correct)"
                              : "var(--theme-text-pending)",
                        }}
                      >
                        {a.title}
                      </span>
                      {a.source && (
                        <span className="text-xs text-[var(--theme-text-muted)]">{a.source}</span>
                      )}
                      {a.reviewStatus === "pending" && (
                        <span className="text-xs text-[var(--theme-accent)]">
                          {t("articleManager.pendingReview")}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleRemove(e, a.id)}
                      className="soft-button ml-4 shrink-0 rounded-lg px-2.5 py-1 text-xs cursor-pointer"
                    >
                      {t("articleManager.delete")}
                    </button>
                  </li>
                ))}
              </ul>
              {hiddenPresetCount > 0 && (
                <button
                  onClick={restorePresets}
                  title={t("articleManager.restorePresetsHint")}
                  className="soft-button self-start rounded-lg px-3 py-1.5 text-xs cursor-pointer"
                >
                  {t("articleManager.restorePresets")} ({hiddenPresetCount})
                </button>
              )}
            </div>
          )}

          {tab === "public" && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-[var(--theme-text-muted)]">
                  {t("articleManager.publicHint")}
                </p>
                <button
                  type="button"
                  onClick={() => void loadPublicArticles()}
                  className="soft-button shrink-0 rounded-lg px-3 py-1.5 text-xs cursor-pointer"
                >
                  {publicLoading ? t("articleManager.loading") : t("articleManager.refresh")}
                </button>
              </div>

              {publicError && (
                <p className="rounded-xl border border-[var(--theme-border)] px-3 py-2 text-xs text-[var(--theme-text-error)]">
                  {publicError}
                </p>
              )}

              <section className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase tracking-[0.16em] text-[var(--theme-text-pending)]">
                    {t("articleManager.publicLibrary")}
                  </h3>
                  <span className="text-xs text-[var(--theme-text-muted)]">
                    {publicArticles.length}
                  </span>
                </div>
                {publicArticles.length === 0 ? (
                  <p className="rounded-xl border border-[var(--theme-border)] px-4 py-3 text-sm text-[var(--theme-text-pending)]">
                    {publicLoading
                      ? t("articleManager.loading")
                      : t("articleManager.noPublicArticles")}
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {publicArticles.map((article) => (
                      <PublicArticleItem
                        key={article.id}
                        article={article}
                        primaryActionLabel={t("articleManager.useArticle")}
                        onPrimary={() => handleSelect(article)}
                        onPreview={() => setPreviewArticle(article)}
                      />
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}

          {tab === "upload" && (
            <div className="flex flex-col gap-3">
              {uploadError && (
                <p className="text-xs" style={{ color: "var(--theme-text-incorrect, #e06c75)" }}>
                  {uploadError}
                </p>
              )}
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="soft-button shrink-0 rounded-xl px-4 py-2 text-sm cursor-pointer"
                >
                  {t("articleManager.chooseFile")}
                </label>
                <span className="text-xs text-[var(--theme-text-muted)] truncate">
                  {uploadContent ? t("articleManager.fileLoaded") : t("articleManager.fileHint")}
                </span>
              </div>
              <input
                type="text"
                placeholder={t("articleManager.uploadTitlePlaceholder")}
                value={uploadTitle}
                onChange={(e) => {
                  setUploadTitle(e.target.value);
                  setUploadError("");
                }}
                className="field w-full rounded-xl px-3 py-2 text-sm outline-none"
              />
              <label className="flex items-center gap-2 text-xs text-[var(--theme-text-pending)]">
                <input
                  type="checkbox"
                  checked={uploadPublic}
                  onChange={(e) => setUploadPublic(e.target.checked)}
                  className="accent-[var(--theme-cursor)]"
                />
                {t("articleManager.submitForReview")}
              </label>
              <button
                onClick={handleUploadSubmit}
                disabled={!uploadContent}
                className="primary-button self-end rounded-xl px-5 py-2 text-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("articleManager.addArticle")}
              </button>
            </div>
          )}

          {tab === "input" && (
            <div className="flex flex-col gap-3">
              {inputError && (
                <p className="text-xs" style={{ color: "var(--theme-text-incorrect, #e06c75)" }}>
                  {inputError}
                </p>
              )}
              <input
                type="text"
                placeholder={t("articleManager.inputTitlePlaceholder")}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setInputError("");
                }}
                className="field w-full rounded-xl px-3 py-2 text-sm outline-none"
              />
              <textarea
                placeholder={t("articleManager.inputContentPlaceholder")}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setInputError("");
                }}
                rows={10}
                className="field w-full resize-none rounded-xl px-3 py-2 text-sm outline-none"
              />
              <label className="flex items-center gap-2 text-xs text-[var(--theme-text-pending)]">
                <input
                  type="checkbox"
                  checked={inputPublic}
                  onChange={(e) => setInputPublic(e.target.checked)}
                  className="accent-[var(--theme-cursor)]"
                />
                {t("articleManager.submitForReview")}
              </label>
              <button
                onClick={handleInputSubmit}
                className="primary-button self-end rounded-xl px-5 py-2 text-sm cursor-pointer"
              >
                {t("articleManager.addArticle")}
              </button>
            </div>
          )}
        </div>
      </div>
      {previewArticle && (
        <ArticlePreviewModal
          article={previewArticle}
          primaryActionLabel={t("articleManager.useArticle")}
          onPrimary={() => handleSelect(previewArticle)}
          onClose={() => setPreviewArticle(null)}
        />
      )}
    </div>
  );
}

function PublicArticleItem({
  article,
  primaryActionLabel,
  onPrimary,
  onPreview,
}: {
  article: Article;
  primaryActionLabel: string;
  onPrimary: () => void;
  onPreview: () => void;
}) {
  const { t } = useTranslation();
  const charCount = article.content.trim().length;

  return (
    <li className="flex items-center justify-between gap-4 rounded-xl border border-[var(--theme-border)] px-4 py-3">
      <button type="button" onClick={onPreview} className="min-w-0 flex-1 text-left">
        <div className="truncate text-sm text-[var(--theme-text-correct)]">{article.title}</div>
        <div className="mt-1 truncate text-xs text-[var(--theme-text-muted)]">
          {article.content}
        </div>
        <div className="mt-2 text-[10px] uppercase tracking-[0.12em] text-[var(--theme-text-muted)]">
          {t("articlePreview.chars", { count: charCount })}
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onPreview}
          className="soft-button rounded-lg px-2.5 py-1 text-xs cursor-pointer"
        >
          {t("articlePreview.view")}
        </button>
        <button
          type="button"
          onClick={onPrimary}
          className="primary-button rounded-lg px-2.5 py-1 text-xs cursor-pointer"
        >
          {primaryActionLabel}
        </button>
      </div>
    </li>
  );
}
