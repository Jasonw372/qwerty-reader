import { lazy, Suspense, useEffect, useState } from "react";
import { HUD } from "./components/hud/HUD.tsx";
import { TypingStage } from "./components/typing/TypingStage.tsx";
import { FinishSummary } from "./components/summary/FinishSummary.tsx";
import { ReadingPreview } from "./components/reading/ReadingPreview.tsx";
import { DictPanel } from "./components/dict/DictPanel.tsx";
import { ShortcutsBar } from "./components/shortcuts/ShortcutsBar.tsx";
import { SettingsModal } from "./components/settings/SettingsModal.tsx";
import { HistoryModal } from "./components/history/HistoryModal.tsx";
import { ReviewQueueModal } from "./components/admin/ReviewQueueModal.tsx";
import { AuthGate } from "./components/auth/AuthGate.tsx";
import { ResetPasswordGate } from "./components/auth/ResetPasswordGate.tsx";
import { useKeyboard } from "./hooks/useKeyboard.ts";
import { useTimer } from "./hooks/useTimer.ts";
import { useDict } from "./hooks/useDict.ts";
import { useTypingStore } from "./store/typingStore.ts";
import { useArticleStore } from "./store/articleStore.ts";
import { useSettingsStore } from "./store/settingsStore.ts";
import { useAuthStore } from "./store/authStore.ts";

type PracticePhase = "reading" | "typing";

const ArticleManager = lazy(() =>
  import("./components/articles/ArticleManager.tsx").then((module) => ({
    default: module.ArticleManager,
  })),
);

export function App() {
  const currentArticle = useArticleStore((s) => s.currentArticle);
  const managerOpen = useArticleStore((s) => s.managerOpen);
  const openManager = useArticleStore((s) => s.openManager);
  const closeManager = useArticleStore((s) => s.closeManager);
  const loadFromStorage = useArticleStore((s) => s.loadFromStorage);
  const syncFromCloud = useArticleStore((s) => s.syncFromCloud);
  const settingsOpen = useSettingsStore((s) => s.settingsOpen);
  const closeSettings = useSettingsStore((s) => s.closeSettings);
  const isFinished = useTypingStore((s) => s.isFinished);
  const { entry, loading, error, lookup, clear } = useDict();
  const [phase, setPhase] = useState<PracticePhase>("typing");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const recoveryMode = useAuthStore((s) => s.recoveryMode);
  const initializeAuth = useAuthStore((s) => s.initialize);
  const authed = Boolean(user) && !recoveryMode;

  useKeyboard(authed && phase === "typing");
  useTimer();

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!authed) return;
    void (async () => {
      await loadFromStorage();
      await syncFromCloud();
    })();
  }, [authed, loadFromStorage, syncFromCloud]);

  useEffect(() => {
    if (!currentArticle) {
      useTypingStore.getState().clearSession();
      return;
    }
    useTypingStore.getState().loadArticle(currentArticle.content);
    setPhase("typing");
  }, [currentArticle]);

  function startTyping() {
    if (!currentArticle) return;
    useTypingStore.getState().loadArticle(currentArticle.content);
    setPhase("typing");
  }

  useEffect(() => {
    if (!authed || !isFinished) return;
    const { wpm, accuracy, elapsed, effectiveTypeCount, correctTypeCount, keystrokes } =
      useTypingStore.getState();
    void import("./lib/sync.ts").then(({ uploadSession }) =>
      uploadSession({
        articleId: currentArticle?.id,
        stats: {
          wpm,
          accuracy,
          elapsed,
          totalChars: correctTypeCount,
          correctChars: correctTypeCount,
          errorChars: Math.max(0, effectiveTypeCount - correctTypeCount),
        },
        keystrokes,
      }),
    );
  }, [authed, isFinished, currentArticle?.id]);

  useEffect(() => {
    if (!authed) return;
    function handleGlobal(e: KeyboardEvent) {
      if (e.key === "Tab") {
        e.preventDefault();
        if (managerOpen) closeManager();
        else openManager();
        return;
      }
      if (e.key === "Escape" && managerOpen) {
        closeManager();
        return;
      }
      if (e.key === "Escape" && settingsOpen) {
        closeSettings();
        return;
      }
      if (e.ctrlKey && e.key === "d") {
        e.preventDefault();
        const selection = window.getSelection()?.toString().trim();
        if (selection) void lookup(selection);
      }
    }
    window.addEventListener("keydown", handleGlobal);
    return () => window.removeEventListener("keydown", handleGlobal);
  }, [authed, lookup, managerOpen, openManager, closeManager, settingsOpen, closeSettings]);

  if (!initialized) {
    return <AuthGate ready={false} />;
  }
  if (recoveryMode) {
    return <ResetPasswordGate />;
  }
  if (!authed) {
    return <AuthGate ready={true} />;
  }

  return (
    <div
      className="app-shell flex h-screen flex-col"
      style={{ backgroundColor: "var(--theme-bg)" }}
    >
      <HUD
        onOpenReading={currentArticle ? () => setPhase("reading") : undefined}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenReview={isCurrentUserAdmin() ? () => setReviewOpen(true) : undefined}
      />
      <main className="flex-1 overflow-y-auto pb-10">
        {currentArticle && phase === "reading" && (
          <ReadingPreview
            article={currentArticle}
            phase="reading"
            onStartReading={() => undefined}
            onStartTyping={startTyping}
          />
        )}
        {phase === "typing" && (isFinished ? <FinishSummary /> : <TypingStage />)}
      </main>
      <DictPanel entry={entry} loading={loading} error={error} onClose={clear} />
      <ShortcutsBar />
      {managerOpen && (
        <Suspense fallback={<ArticleManagerFallback />}>
          <ArticleManager />
        </Suspense>
      )}
      {settingsOpen && <SettingsModal />}
      {historyOpen && <HistoryModal onClose={() => setHistoryOpen(false)} />}
      {reviewOpen && <ReviewQueueModal onClose={() => setReviewOpen(false)} />}
    </div>
  );
}

function isCurrentUserAdmin(): boolean {
  const user = useAuthStore.getState().user;
  return user?.app_metadata?.role === "admin" || user?.user_metadata?.role === "admin";
}

function ArticleManagerFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-3xl rounded-2xl px-6 py-5 font-mono">
        <div className="h-4 w-28 rounded-full bg-[var(--theme-accent-soft)]" />
        <div className="mt-5 h-9 rounded-xl border border-[var(--theme-border)]" />
        <div className="mt-3 h-9 rounded-xl border border-[var(--theme-border)]" />
        <div className="mt-3 h-9 rounded-xl border border-[var(--theme-border)]" />
      </div>
    </div>
  );
}
