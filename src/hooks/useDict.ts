import { useState, useCallback } from "react";
import type { DictEntry } from "../types/index.ts";

interface UseDictReturn {
  entry: DictEntry | null;
  loading: boolean;
  error: string | null;
  lookup: (word: string) => Promise<void>;
  clear: () => void;
}

export function useDict(): UseDictReturn {
  const [entry, setEntry] = useState<DictEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (word: string) => {
    const clean = word
      .trim()
      .toLowerCase()
      .replace(/[^a-z'-]/g, "");
    if (!clean) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`,
      );
      if (!res.ok) {
        setError("Word not found");
        setEntry(null);
        return;
      }
      const data = (await res.json()) as Array<{
        word: string;
        phonetic?: string;
        meanings: Array<{
          partOfSpeech: string;
          definitions: Array<{ definition: string; example?: string }>;
        }>;
      }>;
      const first = data[0];
      setEntry({
        word: first.word,
        phonetic: first.phonetic,
        meanings: first.meanings.slice(0, 2).map((m) => ({
          partOfSpeech: m.partOfSpeech,
          definitions: m.definitions.slice(0, 2),
        })),
      });
    } catch {
      setError("Network error");
      setEntry(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setEntry(null);
    setError(null);
  }, []);

  return { entry, loading, error, lookup, clear };
}
