import { useEffect, useRef, useState } from "react";
import { useTypingStore } from "../../store/typingStore.ts";
import { useSettingsStore } from "../../store/settingsStore.ts";
import { CharSpan } from "./CharSpan.tsx";
import { Cursor } from "./Cursor.tsx";
import { useTranslation } from "react-i18next";

export function TypingStage() {
  const { t } = useTranslation();
  const paragraphs = useTypingStore((s) => s.paragraphs);
  const activeParagraphIndex = useTypingStore((s) => s.activeParagraphIndex);
  const cursor = useTypingStore((s) => s.cursor);
  const viewOffset = useTypingStore((s) => s.viewOffset);
  const shiftViewOffset = useTypingStore((s) => s.shiftViewOffset);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const wheelAccumRef = useRef(0);
  const paragraphRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const [isSmallViewport, setIsSmallViewport] = useState(false);
  const RENDER_WINDOW_RADIUS = 6;
  const displayParagraphIndex = Math.max(
    0,
    Math.min(paragraphs.length - 1, activeParagraphIndex + viewOffset),
  );
  const renderStart = Math.max(0, displayParagraphIndex - RENDER_WINDOW_RADIUS);
  const renderEnd = Math.min(paragraphs.length, displayParagraphIndex + RENDER_WINDOW_RADIUS + 1);
  const visibleParagraphs = paragraphs.slice(renderStart, renderEnd);

  useEffect(() => {
    paragraphRefs.current[displayParagraphIndex]?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
  }, [displayParagraphIndex]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const update = () => setIsSmallViewport(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  function handleWheel(e: React.WheelEvent<HTMLDivElement>): void {
    if (paragraphs.length === 0) return;
    if (Math.abs(e.deltaY) < 0.5) return;
    e.preventDefault();

    wheelAccumRef.current += e.deltaY;
    const threshold = 60;
    if (Math.abs(wheelAccumRef.current) < threshold) return;

    const steps = Math.trunc(wheelAccumRef.current / threshold);
    wheelAccumRef.current -= steps * threshold;
    shiftViewOffset(steps);
  }

  return (
    <div
      className="mx-auto w-full max-w-6xl select-none px-5 md:px-12"
      role="main"
      aria-label={t("typing.areaAria")}
      style={{ paddingTop: "40vh", paddingBottom: "40vh" }}
      onWheel={handleWheel}
    >
      {isSmallViewport && (
        <div className="sticky top-20 z-20 mb-4 flex justify-center">
          <div className="w-full max-w-3xl rounded-2xl border border-amber-300/60 bg-amber-500/15 px-4 py-3 text-center shadow-[0_0_0_1px_rgba(245,158,11,0.28),0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-sm">
            <p className="text-sm font-semibold tracking-wide text-amber-100">
              {t("typing.deviceNoticeTitle")}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-amber-50">{t("typing.deviceNotice")}</p>
          </div>
        </div>
      )}
      {viewOffset !== 0 && (
        <div className="sticky top-20 z-20 mb-4 flex justify-center">
          <div className="glass-panel rounded-full px-4 py-1.5 text-xs text-[var(--theme-text-pending)]">
            {t("typing.browsingNotice")}
          </div>
        </div>
      )}
      {visibleParagraphs.map((para, relativeIndex) => {
        const paraIndex = renderStart + relativeIndex;
        const focusDistance = paraIndex - activeParagraphIndex;
        const viewDistance = paraIndex - displayParagraphIndex;
        const viewing = viewOffset !== 0;
        const isViewCenter = viewDistance === 0;
        const isActive = focusDistance === 0;
        const opacity = viewing
          ? isViewCenter
            ? 0.98
            : Math.abs(viewDistance) === 1
              ? 0.34
              : 0.12
          : isActive
            ? 1
            : Math.abs(focusDistance) === 1
              ? 0.25
              : 0.08;
        const blur = viewing
          ? isViewCenter
            ? 0
            : Math.abs(viewDistance) === 1
              ? 1
              : 2
          : isActive
            ? 0
            : Math.abs(focusDistance) === 1
              ? 1
              : 2;

        return (
          <p
            key={para.id}
            ref={(el) => {
              paragraphRefs.current[paraIndex] = el;
            }}
            className={`mb-14 rounded-2xl font-mono leading-loose transition-all duration-500 md:mb-16 ${
              isActive ? "glass-panel px-5 py-6 md:px-8 md:py-7" : "px-5 py-3 md:px-8"
            }`}
            style={{
              fontSize: `${fontSize}px`,
              letterSpacing: "0.02em",
              opacity,
              filter: `blur(${blur}px)`,
              boxShadow: isActive
                ? "inset 0 1px 0 color-mix(in srgb, var(--theme-text-correct) 14%, transparent), 0 28px 90px var(--theme-shadow)"
                : viewing && isViewCenter
                  ? "inset 0 1px 0 color-mix(in srgb, var(--theme-cursor) 18%, transparent)"
                  : undefined,
              pointerEvents: isActive ? "auto" : "none",
            }}
          >
            {para.chars.map((c, i) => (
              <span key={i} className="relative">
                <CharSpan char={c.char} status={c.status} />
                {paraIndex === activeParagraphIndex && i === cursor && <Cursor visible />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
