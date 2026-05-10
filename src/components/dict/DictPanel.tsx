import type { DictEntry } from "../../types/index.ts";
import { motion, AnimatePresence } from "motion/react";

interface DictPanelProps {
  entry: DictEntry | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}

export function DictPanel({ entry, loading, error, onClose }: DictPanelProps) {
  const visible = loading || !!entry || !!error;

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.2 }}
          className="fixed right-6 top-20 w-72 rounded-lg p-4 text-sm font-mono shadow-xl z-20"
          style={{
            backgroundColor: "var(--theme-surface)",
            border: "1px solid var(--theme-border)",
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-[var(--theme-text-pending)] hover:text-[var(--theme-text-correct)] transition-colors"
            aria-label="Close dictionary"
          >
            ✕
          </button>

          {loading && <p className="text-[var(--theme-text-pending)]">Looking up…</p>}

          {error && <p className="text-[var(--theme-text-error)]">{error}</p>}

          {entry && (
            <div>
              <p className="text-[var(--theme-text-correct)] font-medium text-base">{entry.word}</p>
              {entry.phonetic && (
                <p className="text-[var(--theme-text-pending)] text-xs mb-3">{entry.phonetic}</p>
              )}
              {entry.meanings.map((m, i) => (
                <div key={i} className="mb-3">
                  <p className="text-[var(--theme-cursor)] text-xs uppercase tracking-wide mb-1">
                    {m.partOfSpeech}
                  </p>
                  {m.definitions.map((d, j) => (
                    <p key={j} className="text-[var(--theme-text-pending)] text-xs leading-relaxed">
                      {d.definition}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
