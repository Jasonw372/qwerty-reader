import { useEffect, useRef } from "react";
import { HUD } from "./components/hud/HUD.tsx";
import { TypingStage } from "./components/typing/TypingStage.tsx";
import { DictPanel } from "./components/dict/DictPanel.tsx";
import { ShortcutsBar } from "./components/shortcuts/ShortcutsBar.tsx";
import { ArticleManager } from "./components/articles/ArticleManager.tsx";
import { useKeyboard } from "./hooks/useKeyboard.ts";
import { useTimer } from "./hooks/useTimer.ts";
import { useDict } from "./hooks/useDict.ts";
import { useTypingStore } from "./store/typingStore.ts";
import { useArticleStore } from "./store/articleStore.ts";

export function App() {
  const currentArticle = useArticleStore((s) => s.currentArticle);
  const managerOpen = useArticleStore((s) => s.managerOpen);
  const openManager = useArticleStore((s) => s.openManager);
  const closeManager = useArticleStore((s) => s.closeManager);
  const loadFromStorage = useArticleStore((s) => s.loadFromStorage);
  const { entry, loading, error, lookup, clear } = useDict();
  const loadedRef = useRef<string | null>(null);

  useKeyboard();
  useTimer();

  useEffect(() => {
    void loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (currentArticle && loadedRef.current !== currentArticle.id) {
      loadedRef.current = currentArticle.id;
      useTypingStore.getState().loadArticle(currentArticle.content);
    }
  }, [currentArticle]);

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
      if (e.ctrlKey && e.key === "d") {
        e.preventDefault();
        const selection = window.getSelection()?.toString().trim();
        if (selection) void lookup(selection);
      }
    }
    window.addEventListener("keydown", handleGlobal);
    return () => window.removeEventListener("keydown", handleGlobal);
  }, [lookup, managerOpen, openManager, closeManager]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--theme-bg)" }}>
      <HUD />
      <main className="flex-1 overflow-y-auto pb-10">
        <TypingStage />
      </main>
      <DictPanel entry={entry} loading={loading} error={error} onClose={clear} />
      <ShortcutsBar />
      {managerOpen && <ArticleManager />}
    </div>
  );
}
