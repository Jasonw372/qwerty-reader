import { useEffect, useMemo, useRef, useState } from "react";
import { useArticleStore } from "../../store/articleStore.ts";
import type { Article } from "../../types/index.ts";
import { useTranslation } from "react-i18next";
import { currentUserIsAdmin, deletePublicArticle, fetchPublicArticles } from "../../lib/sync.ts";
import { ArticleContentEditor } from "./ArticleContentEditor.tsx";
import { ArticlePreviewModal } from "./ArticlePreviewModal.tsx";
import { TagFilter } from "./TagFilter.tsx";

type Tab = "list" | "public" | "create";

const LOCAL_PAGE_SIZE = 10;
const PUBLIC_PAGE_SIZE = 8;

function isAllowedEnglishChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return code === 9 || code === 10 || code === 13 || (code >= 32 && code <= 126);
}

function isEnglishOnlyText(value: string): boolean {
  return Array.from(value).every(isAllowedEnglishChar);
}

function getNonEnglishChars(value: string): string[] {
  return Array.from(new Set(Array.from(value).filter((char) => !isAllowedEnglishChar(char)))).slice(
    0,
    12,
  );
}

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
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftError, setDraftError] = useState("");
  const [invalidChars, setInvalidChars] = useState<string[]>([]);
  const [draftPublic, setDraftPublic] = useState(false);
  const [loadedFileName, setLoadedFileName] = useState("");
  const [publicArticles, setPublicArticles] = useState<Article[]>([]);
  const [publicTotal, setPublicTotal] = useState(0);
  const [publicPage, setPublicPage] = useState(1);
  const [publicSearchDraft, setPublicSearchDraft] = useState("");
  const [publicSearch, setPublicSearch] = useState("");
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicError, setPublicError] = useState("");
  const [deletingPublicId, setDeletingPublicId] = useState<string | null>(null);
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);
  const [localPage, setLocalPage] = useState(1);
  const [localTagFilter, setLocalTagFilter] = useState<string[]>([]);
  const [publicTagFilter, setPublicTagFilter] = useState<string[]>([]);
  const [draftTags, setDraftTags] = useState<string[]>([]);
  const isAdmin = currentUserIsAdmin();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadPublicArticles() {
    setPublicLoading(true);
    setPublicError("");
    try {
      const result = await fetchPublicArticles({
        page: publicPage,
        pageSize: PUBLIC_PAGE_SIZE,
        search: publicSearch,
        tags: publicTagFilter.length > 0 ? publicTagFilter : undefined,
      });
      setPublicArticles(result.articles);
      setPublicTotal(result.total);
    } catch (err) {
      setPublicError(err instanceof Error ? err.message : t("articleManager.publicLoadError"));
    } finally {
      setPublicLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "public") void loadPublicArticles();
  }, [tab, publicPage, publicSearch, publicTagFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPublicSearch(publicSearchDraft.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [publicSearchDraft]);

  useEffect(() => {
    setLocalPage(1);
  }, [articles.length, localTagFilter]);

  useEffect(() => {
    setPublicPage(1);
  }, [publicSearch, publicTagFilter]);

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
      setDraftTitle((current) => current || file.name.replace(/\.txt$/i, ""));
      setDraftContent(text.trim());
      setLoadedFileName(file.name);
      setDraftError("");
    };
    reader.readAsText(file, "utf-8");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleCreateSubmit() {
    if (!draftTitle.trim()) {
      setDraftError(t("articleManager.errorTitleRequired"));
      setInvalidChars([]);
      return;
    }
    if (!draftContent.trim()) {
      setDraftError(t("articleManager.errorContentRequired"));
      setInvalidChars([]);
      return;
    }
    if (!isEnglishOnlyText(draftContent)) {
      setDraftError(t("articleManager.errorEnglishOnly"));
      setInvalidChars(getNonEnglishChars(draftContent));
      return;
    }
    const article: Article = {
      id: crypto.randomUUID(),
      title: draftTitle.trim(),
      content: draftContent.trim(),
      source: loadedFileName ? "upload" : "manual",
      tags: draftTags.length > 0 ? draftTags : undefined,
      reviewStatus: draftPublic ? "pending" : "private",
    };
    addArticle(article);
    setCurrentArticle(article);
    setDraftTitle("");
    setDraftContent("");
    setDraftError("");
    setDraftPublic(false);
    setDraftTags([]);
    setLoadedFileName("");
    closeManager();
  }

  async function handleDeletePublicArticle(id: string) {
    const confirmed = window.confirm(t("articleManager.deletePublicConfirm"));
    if (!confirmed) return;

    setDeletingPublicId(id);
    setPublicError("");
    const { error } = await deletePublicArticle(id);
    setDeletingPublicId(null);
    if (error) {
      setPublicError(error);
      return;
    }
    if (previewArticle?.id === id) setPreviewArticle(null);
    await loadPublicArticles();
  }

  const filteredLocalArticles = useMemo(() => {
    if (localTagFilter.length === 0) return articles;
    return articles.filter((a) => a.tags && a.tags.some((tag) => localTagFilter.includes(tag)));
  }, [articles, localTagFilter]);

  const localTotalPages = Math.max(1, Math.ceil(filteredLocalArticles.length / LOCAL_PAGE_SIZE));
  const localPageArticles = useMemo(() => {
    const safePage = Math.min(localPage, localTotalPages);
    const start = (safePage - 1) * LOCAL_PAGE_SIZE;
    return filteredLocalArticles.slice(start, start + LOCAL_PAGE_SIZE);
  }, [filteredLocalArticles, localPage, localTotalPages]);
  const publicTotalPages = Math.max(1, Math.ceil(publicTotal / PUBLIC_PAGE_SIZE));

  const tabs: { key: Tab; label: string }[] = [
    { key: "list", label: t("articleManager.tabList") },
    { key: "public", label: t("articleManager.tabPublic") },
    { key: "create", label: t("articleManager.tabCreate") },
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
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-full border px-3 py-1.5 text-xs cursor-pointer transition-colors ${
                  tab === key
                    ? "border-[var(--theme-border-strong)] bg-[var(--theme-accent-soft)] text-[var(--theme-text-correct)]"
                    : "border-[var(--theme-border)] text-[var(--theme-text-pending)] hover:text-[var(--theme-text-correct)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={closeManager}
            className="icon-button rounded-lg px-3 py-1.5 text-xs cursor-pointer"
          >
            Esc
          </button>
        </div>

        {tab !== "create" && (
          <div className="border-b border-[var(--theme-border)] px-6 pb-3">
            <TagFilter
              selected={tab === "list" ? localTagFilter : publicTagFilter}
              onChange={tab === "list" ? setLocalTagFilter : setPublicTagFilter}
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "list" && (
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
              <ul className="flex flex-col gap-1.5">
                {localPageArticles.map((a) => (
                  <LocalArticleItem
                    key={a.id}
                    article={a}
                    active={a.id === currentArticle?.id}
                    onSelect={() => handleSelect(a)}
                    onRemove={(e) => handleRemove(e, a.id)}
                  />
                ))}
              </ul>
              <PaginationControls
                page={localPage}
                totalPages={localTotalPages}
                onPrevious={() => setLocalPage((page) => Math.max(1, page - 1))}
                onNext={() => setLocalPage((page) => Math.min(localTotalPages, page + 1))}
              />
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
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <input
                  type="search"
                  value={publicSearchDraft}
                  onChange={(e) => setPublicSearchDraft(e.target.value)}
                  placeholder={t("articleManager.searchPublicPlaceholder")}
                  className="field h-9 w-full rounded-xl px-3 text-sm outline-none"
                />
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
                      deleteActionLabel={isAdmin ? t("articleManager.delete") : undefined}
                      busy={deletingPublicId === article.id}
                      onPrimary={() => handleSelect(article)}
                      onPreview={() => setPreviewArticle(article)}
                      onDelete={
                        isAdmin ? () => void handleDeletePublicArticle(article.id) : undefined
                      }
                    />
                  ))}
                </ul>
              )}
              <PaginationControls
                page={publicPage}
                totalPages={publicTotalPages}
                onPrevious={() => setPublicPage((page) => Math.max(1, page - 1))}
                onNext={() => setPublicPage((page) => Math.min(publicTotalPages, page + 1))}
              />
            </div>
          )}

          {tab === "create" && (
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
              {draftError && (
                <div
                  role="alert"
                  className="rounded-xl border px-4 py-3 text-xs leading-5"
                  style={{
                    borderColor: "color-mix(in srgb, var(--theme-text-error) 28%, transparent)",
                    backgroundColor: "color-mix(in srgb, var(--theme-text-error) 8%, transparent)",
                    color: "var(--theme-text-pending)",
                  }}
                >
                  <div className="mb-1 font-medium text-[var(--theme-text-correct)]">
                    {t("articleManager.formNoticeTitle")}
                  </div>
                  <div>{draftError}</div>
                  {invalidChars.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {invalidChars.map((char) => (
                        <span
                          key={char}
                          className="rounded-md border px-2 py-1 font-mono text-[11px] text-[var(--theme-text-correct)]"
                          style={{
                            borderColor:
                              "color-mix(in srgb, var(--theme-text-error) 34%, transparent)",
                            backgroundColor:
                              "color-mix(in srgb, var(--theme-text-error) 12%, transparent)",
                          }}
                        >
                          {char}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="rounded-xl border border-[var(--theme-border)] px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm text-[var(--theme-text-correct)]">
                      {t("articleManager.fileImportTitle")}
                    </div>
                    <div className="mt-1 truncate text-xs text-[var(--theme-text-muted)]">
                      {loadedFileName || t("articleManager.fileHint")}
                    </div>
                  </div>
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
                    {loadedFileName
                      ? t("articleManager.replaceFile")
                      : t("articleManager.chooseFile")}
                  </label>
                </div>
              </div>
              <input
                type="text"
                placeholder={t("articleManager.inputTitlePlaceholder")}
                value={draftTitle}
                onChange={(e) => {
                  setDraftTitle(e.target.value);
                  setDraftError("");
                  setInvalidChars([]);
                }}
                className="field w-full rounded-xl px-3 py-2 text-sm outline-none"
              />
              <ArticleContentEditor
                value={draftContent}
                placeholderText={t("articleManager.inputContentPlaceholder")}
                invalid={invalidChars.length > 0}
                onChange={(nextContent) => {
                  setDraftContent(nextContent);
                  setDraftError("");
                  setInvalidChars([]);
                }}
              />
              <p className="rounded-xl border border-[var(--theme-border)] px-3 py-2 text-xs leading-5 text-[var(--theme-text-muted)]">
                {t("articleManager.englishOnlyHint")}
              </p>
              <div className="rounded-xl border border-[var(--theme-border)] px-4 py-3">
                <div className="mb-2 text-xs text-[var(--theme-text-pending)]">
                  {t("tags.selectTags")}
                </div>
                <TagFilter selected={draftTags} onChange={setDraftTags} showAllOption={false} />
              </div>
              <div className="flex flex-col gap-3 border-t border-[var(--theme-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 text-xs text-[var(--theme-text-pending)]">
                  <input
                    type="checkbox"
                    checked={draftPublic}
                    onChange={(e) => setDraftPublic(e.target.checked)}
                    className="accent-[var(--theme-cursor)]"
                  />
                  {t("articleManager.submitForReview")}
                </label>
                <div className="flex items-center justify-end gap-3">
                  <span className="text-xs text-[var(--theme-text-muted)]">
                    {t("articlePreview.chars", { count: draftContent.trim().length })}
                  </span>
                  <button
                    onClick={handleCreateSubmit}
                    className="primary-button rounded-xl px-5 py-2 text-sm cursor-pointer"
                  >
                    {t("articleManager.addArticle")}
                  </button>
                </div>
              </div>
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

function PaginationControls({
  page,
  totalPages,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-end gap-2 pt-2">
      <button
        type="button"
        onClick={onPrevious}
        disabled={page <= 1}
        className="soft-button rounded-lg px-2.5 py-1 text-xs cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t("articleManager.previousPage")}
      </button>
      <span className="min-w-16 text-center text-xs text-[var(--theme-text-muted)]">
        {t("articleManager.pageIndicator", { page, total: totalPages })}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={page >= totalPages}
        className="soft-button rounded-lg px-2.5 py-1 text-xs cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t("articleManager.nextPage")}
      </button>
    </div>
  );
}

function LocalArticleItem({
  article,
  active,
  onSelect,
  onRemove,
}: {
  article: Article;
  active: boolean;
  onSelect: () => void;
  onRemove: (event: React.MouseEvent) => void;
}) {
  const { t } = useTranslation();

  return (
    <li
      onClick={onSelect}
      className="grid cursor-pointer grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-[var(--theme-border)] px-3 py-2 transition-colors hover:border-[var(--theme-border-strong)]"
      style={{
        backgroundColor: active ? "var(--theme-hud-bg)" : "transparent",
      }}
    >
      <div className="min-w-0">
        <div
          className="truncate text-sm"
          style={{
            color: active ? "var(--theme-text-correct)" : "var(--theme-text-pending)",
          }}
        >
          {article.title}
        </div>
        <div className="mt-1 flex min-w-0 items-center gap-2 text-[11px] text-[var(--theme-text-muted)]">
          {article.source && <span className="truncate">{article.source}</span>}
          {article.reviewStatus === "pending" && (
            <span className="shrink-0 text-[var(--theme-accent)]">
              {t("articleManager.pendingReview")}
            </span>
          )}
        </div>
        {article.tags && article.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[var(--theme-border)] px-1.5 py-0.5 text-[10px] text-[var(--theme-text-muted)]"
              >
                {t(`tags.${tag}`)}
              </span>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={onRemove}
        className="soft-button shrink-0 rounded-lg px-2.5 py-1 text-xs cursor-pointer"
      >
        {t("articleManager.delete")}
      </button>
    </li>
  );
}

function PublicArticleItem({
  article,
  primaryActionLabel,
  deleteActionLabel,
  busy = false,
  onPrimary,
  onPreview,
  onDelete,
}: {
  article: Article;
  primaryActionLabel: string;
  deleteActionLabel?: string;
  busy?: boolean;
  onPrimary: () => void;
  onPreview: () => void;
  onDelete?: () => void;
}) {
  const { t } = useTranslation();
  const charCount = article.content.trim().length;

  return (
    <li className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-[var(--theme-border)] px-3 py-2">
      <button type="button" onClick={onPreview} className="min-w-0 flex-1 text-left">
        <div className="truncate text-sm text-[var(--theme-text-correct)]">{article.title}</div>
        <div className="mt-1 truncate text-xs text-[var(--theme-text-muted)]">
          {article.content}
        </div>
        <div className="mt-1 flex items-center gap-2 text-[10px] text-[var(--theme-text-muted)]">
          <span className="uppercase tracking-[0.12em]">
            {t("articlePreview.chars", { count: charCount })}
          </span>
          {article.tags && article.tags.length > 0 && (
            <span className="flex gap-1">
              {article.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[var(--theme-border)] px-1.5 py-0.5"
                >
                  {t(`tags.${tag}`)}
                </span>
              ))}
            </span>
          )}
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
        {deleteActionLabel && onDelete && (
          <button
            type="button"
            disabled={busy}
            onClick={onDelete}
            className="soft-button rounded-lg px-2.5 py-1 text-xs text-[var(--theme-text-error)] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleteActionLabel}
          </button>
        )}
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
