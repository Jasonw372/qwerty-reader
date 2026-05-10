import { useRef, useState } from "react";
import { useArticleStore } from "../../store/articleStore.ts";
import type { Article } from "../../types/index.ts";

type Tab = "list" | "upload" | "input";

export function ArticleManager() {
  const articles = useArticleStore((s) => s.articles);
  const currentArticle = useArticleStore((s) => s.currentArticle);
  const setCurrentArticle = useArticleStore((s) => s.setCurrentArticle);
  const addArticle = useArticleStore((s) => s.addArticle);
  const removeArticle = useArticleStore((s) => s.removeArticle);
  const closeManager = useArticleStore((s) => s.closeManager);

  const [tab, setTab] = useState<Tab>("list");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [inputError, setInputError] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadContent, setUploadContent] = useState("");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setUploadError("请输入标题");
      return;
    }
    if (!uploadContent.trim()) {
      setUploadError("请先选择文件");
      return;
    }
    const article: Article = {
      id: `file-${Date.now()}`,
      title: uploadTitle.trim(),
      content: uploadContent,
      source: "upload",
    };
    addArticle(article);
    setCurrentArticle(article);
    setUploadTitle("");
    setUploadContent("");
    setUploadError("");
    closeManager();
  }

  function handleInputSubmit() {
    if (!title.trim()) {
      setInputError("请输入标题");
      return;
    }
    if (!content.trim()) {
      setInputError("请输入内容");
      return;
    }
    const article: Article = {
      id: `manual-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      source: "manual",
    };
    addArticle(article);
    setCurrentArticle(article);
    setTitle("");
    setContent("");
    setInputError("");
    closeManager();
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "list", label: "文章列表" },
    { key: "upload", label: "上传文件" },
    { key: "input", label: "手动输入" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={closeManager}
    >
      <div
        className="relative w-full max-w-2xl mx-4 rounded-xl font-mono overflow-hidden flex flex-col max-h-[80vh] border border-[var(--theme-border)]"
        style={{ backgroundColor: "var(--theme-bg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--theme-border)]">
          <span className="text-sm font-medium text-[var(--theme-text-correct)]">文章管理</span>
          <button
            onClick={closeManager}
            className="text-xs px-2 py-1 rounded border border-[var(--theme-border)] text-[var(--theme-text-pending)] hover:text-[var(--theme-text-correct)] hover:border-[var(--theme-text-correct)] transition-colors bg-transparent cursor-pointer"
          >
            Esc
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-4 gap-6 text-xs">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`pb-1 bg-transparent border-0 border-b cursor-pointer transition-colors ${
                tab === key
                  ? "text-[var(--theme-text-correct)] border-[var(--theme-text-correct)]"
                  : "text-[var(--theme-text-pending)] border-transparent hover:text-[var(--theme-text-correct)]"
              }`}
              style={{ fontFamily: "inherit", fontSize: "inherit" }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {tab === "list" && (
            <ul className="flex flex-col gap-2">
              {articles.map((a) => (
                <li
                  key={a.id}
                  onClick={() => handleSelect(a)}
                  className="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer border border-[var(--theme-border)] hover:border-[var(--theme-text-pending)] transition-colors"
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
                  </div>
                  {a.id !== "sample-1" && (
                    <button
                      onClick={(e) => handleRemove(e, a.id)}
                      className="ml-4 shrink-0 text-xs px-2 py-0.5 rounded border border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-pending)] hover:border-[var(--theme-text-pending)] transition-colors bg-transparent cursor-pointer"
                      style={{ fontFamily: "inherit" }}
                    >
                      删除
                    </button>
                  )}
                </li>
              ))}
            </ul>
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
                  className="shrink-0 px-4 py-2 rounded text-sm cursor-pointer border border-[var(--theme-border)] text-[var(--theme-text-correct)] hover:border-[var(--theme-text-correct)] transition-colors"
                  style={{ backgroundColor: "var(--theme-hud-bg)" }}
                >
                  选择文件
                </label>
                <span className="text-xs text-[var(--theme-text-muted)] truncate">
                  {uploadContent ? "已加载文件内容" : "支持 .txt 纯文本文件"}
                </span>
              </div>
              <input
                type="text"
                placeholder="文章标题（选择文件后自动填入，可修改）"
                value={uploadTitle}
                onChange={(e) => {
                  setUploadTitle(e.target.value);
                  setUploadError("");
                }}
                className="w-full px-3 py-2 rounded text-sm outline-none border border-[var(--theme-border)] focus:border-[var(--theme-text-pending)] transition-colors text-[var(--theme-text-pending)] placeholder:text-[var(--theme-text-muted)]"
                style={{ backgroundColor: "var(--theme-hud-bg)", fontFamily: "inherit" }}
              />
              <button
                onClick={handleUploadSubmit}
                disabled={!uploadContent}
                className="self-end px-5 py-2 rounded text-sm border border-[var(--theme-border)] text-[var(--theme-text-correct)] hover:border-[var(--theme-text-correct)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: "var(--theme-hud-bg)", fontFamily: "inherit" }}
              >
                添加文章
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
                placeholder="文章标题"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setInputError("");
                }}
                className="w-full px-3 py-2 rounded text-sm outline-none border border-[var(--theme-border)] focus:border-[var(--theme-text-pending)] transition-colors text-[var(--theme-text-pending)] placeholder:text-[var(--theme-text-muted)]"
                style={{ backgroundColor: "var(--theme-hud-bg)", fontFamily: "inherit" }}
              />
              <textarea
                placeholder="粘贴或输入文章内容..."
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setInputError("");
                }}
                rows={10}
                className="w-full px-3 py-2 rounded text-sm outline-none resize-none border border-[var(--theme-border)] focus:border-[var(--theme-text-pending)] transition-colors text-[var(--theme-text-pending)] placeholder:text-[var(--theme-text-muted)]"
                style={{ backgroundColor: "var(--theme-hud-bg)", fontFamily: "inherit" }}
              />
              <button
                onClick={handleInputSubmit}
                className="self-end px-5 py-2 rounded text-sm border border-[var(--theme-border)] text-[var(--theme-text-correct)] hover:border-[var(--theme-text-correct)] transition-colors cursor-pointer"
                style={{ backgroundColor: "var(--theme-hud-bg)", fontFamily: "inherit" }}
              >
                添加文章
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
