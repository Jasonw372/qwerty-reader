import { memo } from "react";
import { motion } from "motion/react";
import { CharSpan } from "./CharSpan.tsx";
import { Cursor } from "./Cursor.tsx";
import { cn } from "../../lib/cn.ts";
import type { ParagraphData } from "../../types/index.ts";

interface ParagraphProps {
  paragraph: ParagraphData;
  isActive: boolean;
  cursor: number;
}

export const Paragraph = memo(function Paragraph({ paragraph, isActive, cursor }: ParagraphProps) {
  return (
    <motion.p
      className={cn(
        "leading-loose text-lg font-mono transition-all duration-500 mb-8",
        paragraph.focus === "active" && "opacity-100",
        paragraph.focus === "done" && "opacity-30",
        paragraph.focus === "upcoming" && "opacity-30 blur-[1px]",
      )}
      animate={{
        opacity: paragraph.focus === "active" ? 1 : 0.3,
        filter: paragraph.focus === "upcoming" ? "blur(1px)" : "blur(0px)",
      }}
      transition={{ duration: 0.4 }}
    >
      {paragraph.chars.map((c, i) => (
        <span key={i} className="relative">
          <CharSpan char={c.char} status={c.status} />
          {isActive && i === cursor && <Cursor visible />}
        </span>
      ))}
    </motion.p>
  );
});
