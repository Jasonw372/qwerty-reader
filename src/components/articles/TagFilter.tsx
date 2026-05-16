import { useTranslation } from "react-i18next";
import { PRESET_TAGS } from "../../data/tags.ts";

interface TagFilterProps {
  selected: string[];
  onChange: (tags: string[]) => void;
  showAllOption?: boolean;
}

export function TagFilter({ selected, onChange, showAllOption = true }: TagFilterProps) {
  const { t } = useTranslation();

  function toggle(tag: string) {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  }

  const activeClass =
    "border-[var(--theme-border-strong)] bg-[var(--theme-accent-soft)] text-[var(--theme-text-correct)] font-medium";
  const inactiveClass =
    "border-transparent text-[var(--theme-text-muted)] hover:text-[var(--theme-text-pending)] hover:border-[var(--theme-border)]";

  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
      {showAllOption && (
        <button
          type="button"
          onClick={() => onChange([])}
          className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] cursor-pointer transition-colors ${
            selected.length === 0 ? activeClass : inactiveClass
          }`}
        >
          {t("tags.all")}
        </button>
      )}
      {PRESET_TAGS.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => toggle(tag)}
          className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] cursor-pointer transition-colors ${
            selected.includes(tag) ? activeClass : inactiveClass
          }`}
        >
          {t(`tags.${tag}`)}
        </button>
      ))}
    </div>
  );
}
