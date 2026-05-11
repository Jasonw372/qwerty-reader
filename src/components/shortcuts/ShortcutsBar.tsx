const SHORTCUTS = [
  { key: "Esc", label: "重练" },
  { key: "Ctrl+D", label: "字典" },
  { key: "Tab", label: "文章" },
];

export function ShortcutsBar() {
  return (
    <footer className="pointer-events-none fixed bottom-3 left-0 right-0 z-10 flex justify-center px-4 font-mono text-xs text-[var(--theme-text-muted)]">
      <div className="glass-panel flex flex-wrap justify-center gap-3 rounded-full px-4 py-2 md:gap-6">
        {SHORTCUTS.map(({ key, label }) => (
          <span key={key}>
            <kbd className="rounded-md border border-[var(--theme-border)] px-1.5 py-0.5 text-[10px] text-[var(--theme-text-pending)]">
              {key}
            </kbd>{" "}
            {label}
          </span>
        ))}
      </div>
    </footer>
  );
}
