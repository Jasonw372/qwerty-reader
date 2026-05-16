import { useEffect, useRef } from "react";
import { EditorState, RangeSetBuilder } from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin, placeholder } from "@codemirror/view";
import type { ViewUpdate } from "@codemirror/view";

function isAllowedEnglishChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return code === 9 || code === 10 || code === 13 || (code >= 32 && code <= 126);
}

const invalidCharacterHighlighter = ViewPlugin.fromClass(
  class {
    decorations;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView) {
      const builder = new RangeSetBuilder<Decoration>();
      const content = view.state.doc.toString();
      let position = 0;

      for (const char of content) {
        const nextPosition = position + char.length;
        if (!isAllowedEnglishChar(char)) {
          builder.add(position, nextPosition, Decoration.mark({ class: "cm-invalid-character" }));
        }
        position = nextPosition;
      }

      return builder.finish();
    }
  },
  {
    decorations: (plugin) => plugin.decorations,
  },
);

export function ArticleContentEditor({
  value,
  onChange,
  placeholderText,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholderText: string;
  invalid: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const initialValueRef = useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!hostRef.current || viewRef.current) return;

    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: initialValueRef.current,
        extensions: [
          EditorView.lineWrapping,
          placeholder(placeholderText),
          invalidCharacterHighlighter,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
        ],
      }),
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [placeholderText]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === value) return;
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
  }, [value]);

  return (
    <div
      ref={hostRef}
      className={`article-content-editor ${invalid ? "article-content-editor-invalid" : ""}`}
    />
  );
}
