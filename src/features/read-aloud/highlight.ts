import { Extension, type Editor } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as PMNode } from "@tiptap/pm/model";

export interface Range {
  from: number;
  to: number;
}

export interface SpeechHighlight {
  sentence: Range | null;
  word: Range | null;
}

const key = new PluginKey<DecorationSet>("speechHighlight");
const EMPTY: SpeechHighlight = { sentence: null, word: null };

/** Set by the read aloud player while a session is open, so clicking a word can jump playback there. */
let clickHandler: ((pos: number) => void) | null = null;

export function setSpeechClickHandler(handler: ((pos: number) => void) | null) {
  clickHandler = handler;
}

function build(doc: PMNode, highlight: SpeechHighlight): DecorationSet {
  const size = doc.content.size;
  const decorations: Decoration[] = [];
  // Positions can go stale if the doc is edited mid-read, so clamp rather than throw.
  const add = (range: Range | null, className: string) => {
    if (!range) return;
    const from = Math.max(0, Math.min(range.from, size));
    const to = Math.max(from, Math.min(range.to, size));
    if (to > from) decorations.push(Decoration.inline(from, to, { class: className }));
  };
  add(highlight.sentence, "speak-sentence");
  add(highlight.word, "speak-word");
  return DecorationSet.create(doc, decorations);
}

/**
 * Draws the read aloud highlight as ProseMirror decorations. They are view
 * only, so they never end up in the saved doc or the undo history.
 */
export const SpeechHighlightExtension = Extension.create({
  name: "speechHighlight",

  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, set) {
            const meta = tr.getMeta(key) as SpeechHighlight | undefined;
            return meta ? build(tr.doc, meta) : set.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations: (state) => key.getState(state),
          handleClick(view, pos) {
            if (!clickHandler) return false;
            // Place the cursor ourselves before seeking. The seek redraws the highlight at once,
            // and a redraw before ProseMirror reads the browser's new selection puts the old cursor back.
            view.dispatch(view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(pos))));
            clickHandler(pos);
            return true;
          },
        },
      }),
    ];
  },
});

export function setSpeechHighlight(editor: Editor | null, highlight: SpeechHighlight | null) {
  if (!editor || editor.isDestroyed) return;
  editor.view.dispatch(editor.state.tr.setMeta(key, highlight ?? EMPTY).setMeta("addToHistory", false));
}
