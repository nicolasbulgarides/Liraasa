/* Liraasa grammar checker: notes on register and direction.
 *
 *   an ascended form outside a sacred text      note  0.8:R10
 *     sacred is a property of the -asa / -asasan forms (word_building.registers)
 *   a negative form: what it inverts            note  -na    (self_check: "-na direction")
 *   hema opening a line: hesitation             note  hema   (self_check: "hema as hesitation")
 */
(function (root) {
  'use strict';
  const C = (root.LiraasaChecker = root.LiraasaChecker || {});
  C.rules = C.rules || {};

  C.rules.register = function register(ctx) {
    const out = [];
    const sacred = ctx.register === 'sacred';
    for (const w of ctx.words) {
      const r = w.reading;
      if (!r || r.kind !== 'lexical') continue;
      const ascended = r.readings.find((x) => x.role === 'an' || x.role === 'aa');
      if (ascended && !sacred && ctx.register) {
        out.push(
          C.diagnostic({
            ...C.at(ctx, w),
            severity: 'note',
            rule: '0.8:R10',
            message:
              '“' +
              w.text +
              '” is an ascended form (' +
              ascended.roleName +
              '): sacred register, or irreverent on purpose.',
          }),
        );
      }
      const neg = r.readings.find((x) => x.role === 'nn');
      if (neg && neg.entry.forms.n) {
        out.push(
          C.diagnostic({
            ...C.at(ctx, w),
            severity: 'note',
            rule: '-na',
            message:
              '“' +
              w.text +
              '” is the negative of ' +
              neg.root +
              ' (“' +
              neg.entry.forms.n.gloss +
              '”): “' +
              neg.gloss +
              '”.',
          }),
        );
      }
    }
    const first = ctx.words[0];
    if (
      first &&
      first.reading &&
      first.reading.kind === 'closed' &&
      first.reading.readings.some(
        (x) => x.cls === 'discourse particle' && /^hesitation/.test(x.gloss),
      ) &&
      ctx.words.length > 1
    ) {
      out.push(
        C.diagnostic({
          ...C.at(ctx, first),
          severity: 'note',
          rule: 'hema',
          message:
            '“' + first.text + '” is hesitation (“well…”, “um”), usually set off by a pause.',
        }),
      );
    }
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
