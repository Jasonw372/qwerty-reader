import { useEffect, useRef } from "react";
import { useTypingStore } from "../../store/typingStore.ts";
import { useSettingsStore } from "../../store/settingsStore.ts";
import { CharSpan } from "./CharSpan.tsx";

export function TypingStage() {
  const paragraphs = useTypingStore((s) => s.paragraphs);
  const activeParagraphIndex = useTypingStore((s) => s.activeParagraphIndex);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const activeRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeParagraphIndex]);

  return (
    <div
      className="mx-auto w-full max-w-6xl select-none px-5 md:px-12"
      role="main"
      aria-label="Typing area"
      style={{ paddingTop: "40vh", paddingBottom: "40vh" }}
    >
      {paragraphs.map((para, paraIndex) => {
        const distance = paraIndex - activeParagraphIndex;
        const opacity = distance === 0 ? 1 : distance === -1 || distance === 1 ? 0.25 : 0.08;
        const blur = distance === 0 ? 0 : Math.abs(distance) === 1 ? 1 : 2;

        return (
          <p
            key={para.id}
            ref={paraIndex === activeParagraphIndex ? activeRef : null}
            className={`mb-14 rounded-2xl font-mono leading-loose transition-all duration-500 md:mb-16 ${
              distance === 0 ? "glass-panel px-5 py-6 md:px-8 md:py-7" : "px-5 py-3 md:px-8"
            }`}
            style={{
              fontSize: `${fontSize}px`,
              letterSpacing: "0.02em",
              opacity,
              filter: `blur(${blur}px)`,
              boxShadow:
                distance === 0
                  ? "inset 0 1px 0 color-mix(in srgb, var(--theme-text-correct) 14%, transparent), 0 28px 90px var(--theme-shadow)"
                  : undefined,
              pointerEvents: distance === 0 ? "auto" : "none",
            }}
          >
            {para.chars.map((c, i) => (
              <CharSpan key={i} char={c.char} status={c.status} />
            ))}
          </p>
        );
      })}
    </div>
  );
}
