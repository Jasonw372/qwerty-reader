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
          className="glass-panel fixed right-4 top-24 z-20 w-[min(20rem,calc(100vw-2rem))] rounded-2xl p-5 text-sm font-mono md:right-6"
        >
          <button
            onClick={onClose}
            className="icon-button absolute top-3 right-3 grid size-7 place-items-center rounded-lg text-xs cursor-pointer"
            aria-label="Close dictionary"
          >
            ✕
          </button>

          {loading && <p className="text-[var(--theme-text-pending)]">Looking up…</p>}

          {error && <p className="text-[var(--theme-text-error)]">{error}</p>}

          {entry && (
            <div>
              <p className="pr-8 text-lg font-medium text-[var(--theme-text-correct)]">
                {entry.word}
              </p>
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
