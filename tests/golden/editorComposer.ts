import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import vm from 'node:vm';

/**
 * Loads the standalone editor's script (editor/index.html) in a bare VM
 * context, up to the start of its DOM-bound store section, and hands back the
 * pure composer and checker functions. The editor is one self-contained page
 * by design, so the test reads it rather than importing a module.
 */

const editorPath = (name: string): string =>
  fileURLToPath(new URL(`../../editor/${name}`, import.meta.url));

/** Everything before this comment is pure: index, parser, checker, composer. */
const STORE_MARKER = '/* ------------------------------------------------------------- store */';

export interface ComposerChunk {
  en: string;
  role: string;
  options: { word: string; kind: string; slot?: number; slotName?: string }[];
  chosen: number;
  isVerb?: boolean;
  after?: string;
  note?: string;
}

export interface ComposerDraft {
  raw: string;
  clauses: { chunks: ComposerChunk[]; negated: boolean; comma: boolean }[];
  question: boolean;
}

export interface Finding {
  line: number;
  severity: 'error' | 'warn' | 'note';
  message: string;
  rule: string;
}

export interface Composer {
  composeSentence(sentence: string): ComposerDraft;
  draftText(draft: ComposerDraft): string;
  checkLine(text: string, no: number, register: string, english?: string): Finding[];
  realignEnglish(before: string[], after: string[], english: string[]): string[];
  /** The bundle's live examples: [liraasa, english, feature]. */
  examples: [string, string, string][];
  checkText(lines: string[], register: string, english: string[]): Finding[];
  backTranslate(line: string): string;
  confirmsDelete(typed: string): boolean;
  removePiece(book: Songbook, id: string, blank: (collectionId: string) => Piece): string;
  songbookHtml(
    pieces: Piece[],
    opts: { collections: Map<string, string>; edition: string; title: string },
  ): string;
}

export interface Piece {
  id: string;
  collectionId: string;
  title: string;
  kind: string;
  register: string;
  text: string;
  updated: string;
  englishLines?: string[];
}

export interface Songbook {
  pieces: Piece[];
  activeId: string;
}

export function loadComposer(): Composer {
  const html = readFileSync(editorPath('index.html'), 'utf8');
  const open = html.indexOf('<script>');
  const cut = html.indexOf(STORE_MARKER);
  if (open < 0 || cut < 0 || cut < open) {
    throw new Error('editor/index.html: inline script or store marker not found');
  }
  const script = html.slice(open + '<script>'.length, cut);

  const context = vm.createContext({});
  context.window = context;
  vm.runInContext(readFileSync(editorPath('liraasa-data.js'), 'utf8'), context);
  return vm.runInContext(
    script +
      '\n;({ composeSentence, draftText, checkLine, realignEnglish, examples: D.examples,' +
      ' confirmsDelete, removePiece, songbookHtml,' +
      ' checkText: typeof checkText === "function" ? checkText : undefined,' +
      ' backTranslate: typeof backTranslate === "function" ? backTranslate : undefined });',
    context,
  ) as Composer;
}
