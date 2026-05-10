const SHORTCUTS = [
  { key: "Esc", label: "重练" },
  { key: "Ctrl+D", label: "字典" },
  { key: "Tab", label: "文章" },
];

export function ShortcutsBar() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 flex justify-center gap-8 py-2 text-xs font-mono text-[var(--theme-text-muted)]">
      {SHORTCUTS.map(({ key, label }) => (
        <span key={key}>
          <kbd className="px-1 py-0.5 rounded text-[10px] border border-[var(--theme-border)] text-[var(--theme-text-pending)]">
            {key}
          </kbd>{" "}
          {label}
        </span>
      ))}
    </footer>
  );
}
