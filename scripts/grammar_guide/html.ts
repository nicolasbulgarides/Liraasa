/**
 * HTML building blocks for the grammar guide.
 *
 * Every piece of Liraasa text goes through `lir()` (or the inline `` `word` ``
 * markup of `md()`), which both styles it and records it. After the guide is
 * built, every recorded word is checked against the lexicon, so a word that
 * is not in canon cannot reach the page (CLAUDE.md: never invent a word).
 */

export function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** How a recorded Liraasa string is to be checked. */
export type WordUse = 'text' | 'unused-slot' | 'retired' | 'morpheme';

export const recorded: { text: string; use: WordUse }[] = [];

/** Liraasa text, set in the serif face and never re-spelled. */
export function lir(text: string, use: WordUse = 'text'): string {
  recorded.push({ text, use });
  const cls =
    use === 'unused-slot' ? 'liraasa unused' : use === 'retired' ? 'liraasa retired' : 'liraasa';
  return `<span class="${cls}" lang="x-liraasa">${esc(text)}</span>`;
}

/** A bound morpheme (`-ri`, `va-`, `R+asa`): code-styled, not a word. */
export function morph(text: string): string {
  recorded.push({ text, use: 'morpheme' });
  return `<code class="morph">${esc(text)}</code>`;
}

/**
 * Light inline markup for prose:
 *  - `` `word` `` → Liraasa (checked); a backticked item starting or ending
 *    with `-` or containing `+` is a morpheme
 *  - `**bold**`, `*italic*`
 *  - `[[1.0:G7]]` → a ruling badge
 */
export function md(text: string): string {
  const parts = text.split(/(`[^`]+`)/g);
  return parts
    .map((part) => {
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        const inner = part.slice(1, -1);
        return /^-|-$|\+/.test(inner) ? morph(inner) : lir(inner);
      }
      return esc(part)
        .replace(/\[\[([^\]]+)\]\]/g, (_m, id: string) => badge(id))
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>');
    })
    .join('');
}

export function badge(id: string): string {
  const edition = id.split(':')[0] ?? '';
  const cls =
    edition === '1.2' ? 'b12' : edition === '1.0' ? 'b10' : edition === '0.8' ? 'b08' : 'badr';
  return `<span class="badge ${cls}" title="Ruling ${esc(id)}">${esc(id)}</span>`;
}

export function p(text: string): string {
  return `<p>${md(text)}</p>`;
}

export function paras(...texts: string[]): string {
  return texts.map(p).join('\n');
}

export function ul(items: readonly string[]): string {
  return `<ul>${items.map((i) => `<li>${md(i)}</li>`).join('')}</ul>`;
}

export type Callout = 'singing' | 'parsing' | 'caution';

const CALLOUT_LABEL: Record<Callout, string> = {
  singing: 'Singing note',
  parsing: 'Parsing note',
  caution: 'Take care',
};

const CALLOUT_ICON: Record<Callout, string> = {
  singing: '♪',
  parsing: '⚙',
  caution: '!',
};

export function callout(kind: Callout, ...texts: string[]): string {
  return calloutHtml(kind, texts.map(p).join(''));
}

/** A callout whose body is already HTML. */
export function calloutHtml(kind: Callout, body: string): string {
  return `<aside class="callout ${kind}" aria-label="${CALLOUT_LABEL[kind]}">
<div class="callout-head"><span class="callout-icon" aria-hidden="true">${CALLOUT_ICON[kind]}</span>${CALLOUT_LABEL[kind]}</div>
${body}
</aside>`;
}

/** A Liraasa line with its English underneath. */
export function example(liraasa: string, english: string, note?: string): string {
  return `<div class="ex"><div class="ex-l">${lir(liraasa)}</div><div class="ex-e">${esc(english)}${
    note === undefined ? '' : ` <span class="ex-note">${md(note)}</span>`
  }</div></div>`;
}

export function examples(rows: readonly (readonly [string, string])[]): string {
  return `<div class="exs">${rows.map(([l, e]) => example(l, e)).join('')}</div>`;
}

/** A table cell: raw HTML, already escaped by the caller. */
export interface Cell {
  html: string;
  cls?: string;
}

export function cell(html: string, cls?: string): Cell {
  return cls === undefined ? { html } : { html, cls };
}

export function table(
  head: readonly string[],
  rows: readonly (readonly (Cell | string)[])[],
  opts: { cls?: string; caption?: string } = {},
): string {
  const th = head.map((h) => `<th scope="col">${esc(h)}</th>`).join('');
  const body = rows
    .map(
      (r) =>
        `<tr>${r
          .map((c) => {
            const x = typeof c === 'string' ? { html: md(c) } : c;
            return `<td${x.cls === undefined ? '' : ` class="${x.cls}"`}>${x.html}</td>`;
          })
          .join('')}</tr>`,
    )
    .join('\n');
  const caption = opts.caption === undefined ? '' : `<caption>${md(opts.caption)}</caption>`;
  return `<div class="table-wrap"><table${opts.cls === undefined ? '' : ` class="${opts.cls}"`}>${caption}<thead><tr>${th}</tr></thead><tbody>${body}</tbody></table></div>`;
}

/**
 * Headings that belong in the table of contents carry `data-toc`, and the
 * contents are read back from the finished page (`tocEntries`), so they are
 * always in document order.
 */
export interface TocEntry {
  id: string;
  title: string;
  level: 2 | 3;
}

const usedIds = new Set<string>();

/** A unique anchor id: a repeated heading gets `-2`, `-3` … */
function uniqueId(base: string): string {
  let id = base;
  for (let i = 2; usedIds.has(id); i += 1) id = `${base}-${String(i)}`;
  usedIds.add(id);
  return id;
}

export function tocEntries(html: string): TocEntry[] {
  const out: TocEntry[] = [];
  for (const m of html.matchAll(/<h([23]) id="([^"]+)" data-toc="([^"]*)"/g)) {
    out.push({ level: m[1] === '2' ? 2 : 3, id: m[2] ?? '', title: m[3] ?? '' });
  }
  return out;
}

export function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function h3(title: string, id = slug(title), inToc = true): string {
  const uid = uniqueId(id);
  const plain = title.replace(/`/g, '');
  return `<h3 id="${uid}"${inToc ? ` data-toc="${esc(plain)}"` : ''}>${md(title)}</h3>`;
}

export function h4(title: string): string {
  return `<h4>${md(title)}</h4>`;
}

/** A part of the guide: one chapter page in print. */
export function part(n: string, title: string, intro: string, body: string): string {
  const id = uniqueId(slug(`part-${n}-${title}`));
  return `<section class="part" aria-labelledby="${id}">
<header class="part-head"><div class="part-num" aria-hidden="true">${esc(n)}</div><h2 id="${id}" data-toc="${esc(`${n}. ${title}`)}"><span class="visually-hidden">Part ${esc(n)}: </span>${esc(title)}</h2><p class="part-intro">${md(intro)}</p></header>
${body}
</section>`;
}
