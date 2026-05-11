export type CharStatus = "pending" | "active" | "correct" | "incorrect";

export type ParagraphFocus = "active" | "done" | "upcoming";

export type Theme = "dark" | "parchment";

export type CursorStyle = "line" | "block" | "underline";

export interface CharState {
  char: string;
  status: CharStatus;
  index: number;
}

export interface ParagraphData {
  id: string;
  text: string;
  chars: CharState[];
  focus: ParagraphFocus;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  source?: string;
}

export interface TypingStats {
  wpm: number;
  accuracy: number;
  elapsed: number;
  totalChars: number;
  correctChars: number;
  errorChars: number;
}

export interface Keystroke {
  timestamp: number;
  correct: boolean;
  input: string;
  expected: string;
  paragraphIndex: number;
}

export interface DictEntry {
  word: string;
  phonetic?: string;
  meanings: DictMeaning[];
}

export interface DictMeaning {
  partOfSpeech: string;
  definitions: { definition: string; example?: string }[];
}
