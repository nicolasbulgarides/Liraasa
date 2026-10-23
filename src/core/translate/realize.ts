/**
 * LSentence → Liraasa text, in the order of the 2.5 templates: the clause
 * (2.5:G126, its edges included) and the noun phrase (2.5:G98). Deterministic:
 * the same frame always gives the same sentence, and every choice that the
 * frame does not fix (an article, a comma) is already in the frame.
 */
import type { LAdjunct, LClause, LNP, LPredicate, LSentence, LWord } from './frame';

const word = (w: LWord): string => w.form + (w.suffixes ?? []).join('');
/** Put punctuation after the last word, once. */
function comma(out: string[], mark = ','): void {
  const last = out[out.length - 1];
  if (last !== undefined && !last.endsWith(mark)) out[out.length - 1] = last + mark;
}

export function realizeNP(np: LNP): string[] {
  const out: string[] = [];
  if (np.scope !== undefined) out.push(word(np.scope));
  if (np.kind === 'sidu' && np.vp !== undefined) {
    out.push('sidu', ...realizeClauseBody(np.vp));
    return out;
  }
  for (const w of [np.degreeQuant, np.quant, np.det, np.ord, np.sign, np.degreeNum, np.num])
    if (w !== undefined) out.push(word(w));
  for (const a of np.adjectives) {
    if (a.degree !== undefined) out.push(word(a.degree));
    out.push(word(a.adj));
  }
  // a number or a demonstrative standing alone is its own head
  out.push(word(np.head));
  if (np.refl !== undefined) out.push(word(np.refl));
  if (np.de !== undefined) out.push('de', ...realizeNP(np.de));
  if (np.relative !== undefined) {
    out.push(...realizeClause(np.relative));
    if (np.relativeComma === true) comma(out);
  }
  if (np.and !== undefined) out.push(word(np.and.linker), ...realizeNP(np.and.np));
  return out;
}

function realizePredicate(p: LPredicate): string[] {
  const out: string[] = [];
  if ((p.kind === 'adj' || p.kind === 'np' || p.kind === 'pp') && p.ne !== undefined)
    out.push(word(p.ne));
  switch (p.kind) {
    case 'adj':
      if (p.tonsi !== undefined) out.push(word(p.tonsi));
      if (p.degree !== undefined) out.push(word(p.degree));
      out.push(word(p.adj));
      if (p.tamo !== undefined) out.push('tamo', ...realizeNP(p.tamo));
      if (p.gase !== undefined) out.push('gase', ...realizeNP(p.gase));
      if (p.sidu !== undefined) out.push('sidu', ...realizeClauseBody(p.sidu));
      break;
    case 'np':
      out.push(...realizeNP(p.np));
      break;
    case 'pp':
      out.push(word(p.prep), ...(p.np === null ? [] : realizeNP(p.np)));
      break;
    case 'adv':
      out.push(word(p.word));
      break;
    case 'kiword':
      out.push(word(p.word));
      if (p.adj !== undefined) out.push(word(p.adj));
      break;
    case 'gap':
      break;
  }
  if ((p.kind === 'adj' || p.kind === 'np' || p.kind === 'pp') && p.and !== undefined)
    for (const q of p.and) out.push('ata', ...realizePredicate(q));
  return out;
}

function realizeAdjunct(a: LAdjunct): string[] {
  switch (a.kind) {
    case 'pp':
      return [
        ...(a.word === undefined ? [] : [word(a.word)]),
        ...(a.np === null || a.np === undefined ? [] : realizeNP(a.np)),
      ];
    case 'la':
      return [
        'la',
        ...(a.degree === undefined ? [] : [word(a.degree)]),
        ...(a.adj === undefined ? [] : [word(a.adj)]),
        ...(a.np === undefined || a.np === null ? [] : ['tamo', ...realizeNP(a.np)]),
      ];
    case 'tamo':
      return ['tamo', ...(a.np === null || a.np === undefined ? [] : realizeNP(a.np))];
    case 'gase':
      return [
        'gase',
        ...(a.adj === undefined ? [] : [word(a.adj), 'gase']),
        ...(a.np === null || a.np === undefined ? [] : realizeNP(a.np)),
      ];
    case 'chain':
      return ['sidu', ...(a.clause === undefined ? [] : realizeClauseBody(a.clause))];
    case 'measure':
      return [
        ...(a.word === undefined ? [] : [word(a.word)]),
        ...(a.np === null || a.np === undefined ? [] : realizeNP(a.np)),
      ];
    case 'kiword':
    case 'scope':
    case 'iteration':
    case 'adv':
      return a.word === undefined ? [] : [word(a.word)];
  }
}

/** The clause from its subject to its closing words (no edges, no linker). */
export function realizeClauseBody(c: LClause): string[] {
  const out: string[] = [];
  if (c.kiFront !== undefined) out.push(word(c.kiFront));
  if (c.subject === 'hortative') out.push('yava');
  else if (c.subject !== null) out.push(...realizeNP(c.subject));
  for (const o of c.ops) out.push(word(o));
  const p = c.pred;
  switch (p.kind) {
    case 'verb':
      out.push(word(p.verb));
      break;
    case 'copula':
      out.push(word(p.cop), ...realizePredicate(p.predicate));
      break;
    case 'valency':
      out.push(word(p.op), ...realizeNP(p.actor));
      for (const o of p.actorOps) out.push(word(o));
      if (p.cop !== undefined && p.predicate !== undefined)
        out.push(word(p.cop), ...realizePredicate(p.predicate));
      else out.push(word(p.verb));
      break;
    case 'passive':
      out.push(word(p.gome), word(p.verb));
      if (p.agent !== undefined) out.push(word(p.agent.gagu), ...realizeNP(p.agent.np));
      break;
    case 'exist':
      out.push(word(p.miyo), ...realizeNP(p.np));
      break;
    case 'bare-adj':
      out.push(...realizePredicate(p.predicate));
      break;
    case 'none':
      break;
  }
  if (c.recipient !== undefined) out.push(...realizeNP(c.recipient));
  if (c.object !== undefined) out.push(...realizeNP(c.object));
  if (c.objectClause !== undefined) out.push(...realizeClause(c.objectClause));
  for (const a of c.adjuncts) {
    if (a.commaBefore === true) comma(out);
    out.push(...realizeAdjunct(a));
  }
  if (c.closingComma === true && (c.closing.length > 0 || c.ki)) comma(out);
  for (const w of c.closing) out.push(word(w));
  if (c.ki) out.push('ki');
  for (const w of c.trailing ?? []) {
    comma(out);
    out.push(word(w));
  }
  return out;
}

/** A whole clause: its linker, edges, body, and the clauses after it. */
export function realizeClause(c: LClause): string[] {
  const out: string[] = [];
  for (const i of c.interjections) out.push(word(i.word) + (i.comma ? ',' : ''));
  for (const b of c.before) {
    const part = realizeClause(b.clause);
    if (b.comma) comma(part);
    out.push(...part);
  }
  if (c.scope !== undefined) out.push(word(c.scope));
  if (c.linker !== undefined) out.push(word(c.linker) + (c.linkerComma === true ? ',' : ''));
  for (const f of c.frame) {
    const part = realizeAdjunct(f.adjunct);
    if (f.comma) comma(part);
    out.push(...part);
  }
  if (c.topic !== undefined) {
    out.push(...realizeNP(c.topic), 'hozi,');
  }
  if (c.vocativeBefore !== undefined) {
    const part = realizeNP(c.vocativeBefore);
    comma(part);
    out.push(...part);
  }
  out.push(...realizeClauseBody(c));
  for (const a of c.after) {
    const part = realizeClause(a.clause);
    if (a.comma) comma(out, a.punct ?? ',');
    out.push(...part);
  }
  if (c.vocative !== undefined) {
    comma(out);
    out.push(...realizeNP(c.vocative));
  }
  return out;
}

export function realize(s: LSentence): string {
  const words = realizeClause(s.main).filter((x) => x !== '');
  const text = words.join(' ');
  return text.charAt(0).toUpperCase() + text.slice(1) + s.end;
}
