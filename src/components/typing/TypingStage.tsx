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
      className="max-w-5xl mx-auto px-12 w-full select-none"
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
            className="font-mono mb-16 leading-loose transition-all duration-500"
            style={{
              fontSize: `${fontSize}px`,
              letterSpacing: "0.02em",
              opacity,
              filter: `blur(${blur}px)`,
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
