import { useEffect, useState } from "react";
import { HUD } from "./components/hud/HUD.tsx";
import { TypingStage } from "./components/typing/TypingStage.tsx";
import { FinishSummary } from "./components/summary/FinishSummary.tsx";
import { ReadingPreview } from "./components/reading/ReadingPreview.tsx";
import { DictPanel } from "./components/dict/DictPanel.tsx";
import { ShortcutsBar } from "./components/shortcuts/ShortcutsBar.tsx";
import { ArticleManager } from "./components/articles/ArticleManager.tsx";
import { SettingsModal } from "./components/settings/SettingsModal.tsx";
import { useKeyboard } from "./hooks/useKeyboard.ts";
import { useTimer } from "./hooks/useTimer.ts";
import { useDict } from "./hooks/useDict.ts";
import { useTypingStore } from "./store/typingStore.ts";
import { useArticleStore } from "./store/articleStore.ts";
import { useSettingsStore } from "./store/settingsStore.ts";

type PracticePhase = "reading" | "typing";

export function App() {
  const currentArticle = useArticleStore((s) => s.currentArticle);
  const managerOpen = useArticleStore((s) => s.managerOpen);
  const openManager = useArticleStore((s) => s.openManager);
  const closeManager = useArticleStore((s) => s.closeManager);
  const loadFromStorage = useArticleStore((s) => s.loadFromStorage);
  const settingsOpen = useSettingsStore((s) => s.settingsOpen);
  const closeSettings = useSettingsStore((s) => s.closeSettings);
  const isFinished = useTypingStore((s) => s.isFinished);
  const { entry, loading, error, lookup, clear } = useDict();
  const [phase, setPhase] = useState<PracticePhase>("typing");

  useKeyboard(phase === "typing");
  useTimer();

  useEffect(() => {
    void loadFromStorage();
  }, [loadFromStorage]);

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
  }, [lookup, managerOpen, openManager, closeManager, settingsOpen, closeSettings]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--theme-bg)" }}>
      <HUD onOpenReading={currentArticle ? () => setPhase("reading") : undefined} />
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
      {managerOpen && <ArticleManager />}
      {settingsOpen && <SettingsModal />}
    </div>
  );
}
