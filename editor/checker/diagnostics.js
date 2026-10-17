/* Liraasa grammar checker: the diagnostic record.
 *
 * Every finding says how serious it is, which rule it comes from, what is
 * wrong in plain English, and how to fix it when a fix exists:
 *
 *   { line, start, end, token, severity, rule, message, fix?, autoFix }
 *
 * severity is error, warn, note, or unsettled: a construction no rule covers
 * yet, reported instead of guessed so the author can write a ruling for it.
 * rule is an edition-qualified ruling id ("1.2:G33"), an ADR ("ADR-0011") or
 * a self_check source ("slot", "never invent"). fix is replacement text for
 * fixStart..fixEnd, which default to the token's own start..end; a fix that
 * moves words replaces the whole line (fixStart 0, fixEnd its length).
 * autoFix is true only when that replacement is unambiguous.
 */
(function (root) {
  'use strict';
  const C = (root.LiraasaChecker = root.LiraasaChecker || {});

  const SEVERITIES = ['error', 'warn', 'note', 'unsettled'];

  function diagnostic(d) {
    if (!SEVERITIES.includes(d.severity)) throw new Error('bad severity: ' + d.severity);
    if (!d.rule) throw new Error('a diagnostic needs a rule id: ' + d.message);
    if (!d.message) throw new Error('a diagnostic needs a message');
    return {
      line: d.line,
      start: d.start,
      end: d.end,
      token: d.token === undefined ? null : d.token,
      severity: d.severity,
      rule: d.rule,
      message: d.message,
      fix: d.fix === undefined ? null : d.fix,
      fixStart: d.fix === undefined ? null : d.fixStart === undefined ? d.start : d.fixStart,
      fixEnd: d.fix === undefined ? null : d.fixEnd === undefined ? d.end : d.fixEnd,
      autoFix: d.autoFix === true && d.fix !== undefined && d.fix !== null,
    };
  }

  /** The position fields of a diagnostic about one word. */
  function at(ctx, word) {
    return { line: ctx.no, start: word.start, end: word.end, token: word.text };
  }

  /** Apply a diagnostic's fix to its line. */
  function applyFix(line, d) {
    if (d.fix === null) return line;
    return line.slice(0, d.fixStart) + d.fix + line.slice(d.fixEnd);
  }

  C.SEVERITIES = SEVERITIES;
  C.diagnostic = diagnostic;
  C.at = at;
  C.applyFix = applyFix;
})(typeof window !== 'undefined' ? window : globalThis);
