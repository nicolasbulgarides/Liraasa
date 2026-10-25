/**
 * One-time tool: the two changesets `npm run integrate:3.5` applies to frozen
 * 3.4 (ADR-0025), in order:
 *
 *   1. 2026-10-25-lexicon-3-5-ratify  the author ratifies 3.0, 3.3 and 3.4
 *   2. 2026-10-25-lexicon-3-5         "Essentials, archetypes and domain packs"
 *
 *   npx tsx scripts/make_changeset_3_5.ts           # write both
 *   npx tsx scripts/make_changeset_3_5.ts --check   # build, write nothing
 *
 * The ratification is the author's decision of 2026-10-25 ("ratify
 * everything"): every proposed ruling of 3.0, 3.2, 3.3 and 3.4 is marked
 * ratified (op ratify_ruling: its status only, never its text), and every
 * headword whose note says it is proposed in 3.0, 3.3 or 3.4 says it is
 * ratified (edit_metadata, field notes), as 3.1 was in 3.3.
 *
 * The 3.5 patch (archived whole in archive/patch_3_5/, with its checksums) is
 * modular. Every module is installed, as the author's own build does: core,
 * archetypes, qualities, casual, the six domain packs and derived-aliases. It
 * adds no roots: 164 compounds, 20 derivations, 11 diminutives, 2 restored
 * forms, 150 English aliases and rulings 3.5:G150 (polygons) and G151 (copied
 * names of foreign things), each entry noting its tier and module. Its
 * recipes go into the guide.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ChangeRecord } from '../src/core/change/changelog';
import type { LexiconChangeset } from '../src/core/change/apply';
import type { RawLexicon } from '../src/core/model/raw';
import { parseArgs } from './args';
import { type AdditionsConfig, makeAdditionsChangeset, recorder } from './make_changeset_3_0';
import type { WordBuilding } from '../src/core/change/apply';
import { WORD_BUILDING_3_3 } from './make_changeset_3_3';

export const ID_RATIFY_3_5 = '2026-10-25-lexicon-3-5-ratify';
export const ID_3_5 = '2026-10-25-lexicon-3-5';
export const ID_AUTHOR_3_5 = '2026-10-25-lexicon-3-5-author';
export const FILES_3_5 = [
  `data/changes/${ID_RATIFY_3_5}.json`,
  `data/changes/${ID_3_5}.json`,
  `data/changes/${ID_AUTHOR_3_5}.json`,
] as const;
const BASELINE = 'data/lexicon/liraasa_3_4.json';

/** 3.3's word building, and a time noun as a compound's head too (felradeya), as the author's validator allows. */
export const WORD_BUILDING_3_5: WordBuilding = { ...WORD_BUILDING_3_3, timeHeads: true };
const AT = '2026-10-25T22:00:00Z';
const EDITION = '3.5';
/** The editions the author ratified on 2026-10-25, and the ruling sets they brought. */
const RATIFIED = ['3.0', '3.3', '3.4'];
const RULING_SETS = ['rulings_3_0', 'rulings_3_2', 'rulings_3_3', 'rulings_3_4'];

/** The author ratifies 3.0, 3.3 and 3.4: their rulings and their headwords' notes. */
export function ratify3_5(): LexiconChangeset {
  const lex = JSON.parse(readFileSync(resolve(BASELINE), 'utf8')) as RawLexicon &
    Record<string, unknown>;
  const rec = recorder({ edition: EDITION, at: AT });
  const why = 'The author ratified 3.0, 3.3 and 3.4 on 2026-10-25 ("ratify everything").';
  const ops: ChangeRecord[] = [];
  for (const key of RULING_SETS) {
    const edition = key.replace('rulings_', '').replace('_', '.');
    for (const r of (lex[key] ?? []) as { id: string; status?: string }[]) {
      if (r.status !== 'proposed') throw new Error(`${edition}:${r.id} is not proposed`);
      ops.push(
        rec(
          'ratify_ruling',
          `${edition}:${r.id}`,
          'proposed',
          'ratified',
          `${edition}:${r.id}`,
          `${why} The ruling's text and examples do not change.`,
        ),
      );
    }
  }
  const heads = lex.headwords as unknown as { id: string; root: string; notes: string }[];
  for (const h of heads) {
    for (const e of RATIFIED) {
      const marker = `Proposed in ${e}: awaiting the author's ratification.`;
      if (!h.notes.includes(marker)) continue;
      ops.push(
        rec(
          'edit_metadata',
          h.id,
          h.notes,
          h.notes.replace(
            marker,
            `Ratified by the author on 2026-10-25 (changeset ${ID_RATIFY_3_5}).`,
          ),
          undefined,
          `${why} ${h.root} is canon.`,
          { field: 'notes' },
        ),
      );
    }
  }
  // the 2.5 erratum every bundle's README names, ratified with the rest: an owner before de is
  // a name or pronoun, so father's bread is li bumre de pilo (2.5:G95)
  const erratum = 'Eli bumre ka sambasan ko pilo de bumre.';
  const at = lex.examples.findIndex((e) => e.liraasa === erratum);
  if (at < 0) throw new Error(`no example "${erratum}"`);
  ops.push(
    rec(
      'edit_example',
      `example:${String(at)}`,
      erratum,
      'Eli bumre ka sambasan ko li bumre de pilo.',
      '2.5:G95',
      `${why} The 2.5 erratum the 3.0-3.5 READMEs name: "pilo de bumre" contradicts 2.5:G95; father's bread is li bumre de pilo.`,
    ),
  );
  return {
    id: ID_RATIFY_3_5,
    edition: EDITION,
    created: AT,
    author: 'nicolas',
    summary:
      "The author ratifies Liraasa 3.0, 3.3 and 3.4 (2026-10-25): every proposed ruling of 3.0, 3.2, 3.3 and 3.4 is marked ratified, its text unchanged, and every 3.0, 3.3 and 3.4 headword's note says it is ratified. With 3.1 (ratified in 3.3), everything up to 3.4 is canon. The 2.5 erratum pilo de bumre is corrected to li bumre de pilo (2.5:G95).",
    ops,
  };
}

export const CONFIG_3_5: AdditionsConfig = {
  patch: 'archive/patch_3_5/patches/liraasa_3_5_patch.json',
  baseline: BASELINE,
  edition: EDITION,
  previous: '3.4',
  at: AT,
  id: ID_3_5,
  name: 'Liraasa 3.5 patch (Essentials, archetypes and domain packs)',
  wordBuilding: WORD_BUILDING_3_5,
  summary: (patch) =>
    `Liraasa 3.5, "Essentials, archetypes and optional domain packs" (ADR-0025), from the author's 3.5 patch, every module installed. PROPOSED: ${patch.status}. ` +
    `Additions only, no new roots: rulings 3.5:G150-G151; ${String(patch.compounds_add.length)} compounds, ` +
    `${String(patch.listed_derivations_add.length)} listed derivations, ${String(patch.lexicalised_diminutives_add.length)} lexicalised diminutives, ` +
    `${String(patch.restored_forms_add.length)} restored forms and ${String((patch.english_aliases_add ?? []).length)} English aliases, each entry noted with its tier and module. ` +
    'No 3.4 word, spelling or ruling changes.',
};

/**
 * The author's decisions after 3.5 was built (2026-10-25): ratify 3.5; maivori
 * includes or excludes the listener by context (a new ruling, 3.5:G152); and
 * zefrolalfo keeps "levitation", so navulalfo takes a meaning of its own.
 */
export function author3_5(additions: LexiconChangeset): LexiconChangeset {
  const lex = JSON.parse(readFileSync(resolve(BASELINE), 'utf8')) as RawLexicon;
  const rec = recorder({ edition: EDITION, at: AT });
  const ops: ChangeRecord[] = [];
  const ratified = 'The author ratified 3.5 on 2026-10-25.';
  // 1. the new ruling, as the author decided it (2026-10-25)
  const g152 = {
    id: 'G152',
    topic: 'maivori: we, with or without the listener',
    ruling:
      'maivori is the first person plural, we. Whether it includes the listener (you and I) or not (they and I) is left to the context: Liraasa has no separate inclusive and exclusive forms. Where the difference matters, name who is meant: maivo ata taivo, you and I; maivori ata taivo, we and you.',
    examples: [
      ['Maivori lirala.', 'We sing (with or without you, as the context shows).'],
      ['Maivo ata taivo lirala.', 'You and I sing.'],
      ['Maivori ata taivo futu pagopa.', 'We and you will go.'],
    ] as [string, string][],
    settles_open_questions: ['Whether maivori includes the listener.'],
    notes: "The author's decision (2026-10-25): make it context specific.",
    status: 'ratified',
  };
  ops.push(
    rec(
      'add_ruling',
      '3.5:G152',
      null,
      g152.topic,
      '3.5:G152',
      `The author decided on 2026-10-25 that maivori is context specific. ${g152.notes}`,
    ),
  );
  // 2. 3.5 ratified: its rulings and its headwords' notes
  for (const r of ['3.5:G150', '3.5:G151'])
    ops.push(
      rec(
        'ratify_ruling',
        r,
        'proposed',
        'ratified',
        r,
        `${ratified} The ruling's text and examples do not change.`,
      ),
    );
  for (const h of additions.headwords ?? []) {
    const marker = "Proposed in 3.5: awaiting the author's ratification.";
    if (!h.notes.includes(marker)) continue;
    ops.push(
      rec(
        'edit_metadata',
        h.id,
        h.notes,
        h.notes.replace(
          marker,
          `Ratified by the author on 2026-10-25 (changeset ${ID_AUTHOR_3_5}).`,
        ),
        undefined,
        `${ratified} ${h.root} is canon.`,
        { field: 'notes' },
      ),
    );
  }
  // 3. navulalfo takes a meaning of its own; zefrolalfo keeps levitation
  const heads = lex.headwords as unknown as {
    id: string;
    root: string;
    glosses: Record<string, string>;
  }[];
  const nav = heads.find((h) => h.root === 'navulalfo');
  if (nav === undefined) throw new Error('navulalfo is not a headword');
  const glosses: [string, 'root' | 'verb', string][] = [
    ['root', 'root', 'a rise into the sky; skyward floating'],
    ['verb', 'verb', 'to float up into the sky'],
  ];
  for (const [raw, slot, to] of glosses) {
    const from = nav.glosses[raw] ?? '';
    ops.push(
      rec(
        'edit_gloss',
        nav.id,
        from,
        to,
        '0.8:R2',
        `The author keeps zefrolalfo as "levitation" (2026-10-25); navulalfo (navu + lalfo, sky + floating) takes a meaning of its own. Its old gloss "${from}" is archived.`,
        { slot, archive: true },
      ),
    );
  }
  return {
    id: ID_AUTHOR_3_5,
    edition: EDITION,
    created: AT,
    author: 'nicolas',
    summary:
      'The author’s decisions of 2026-10-25 after the 3.5 build: 3.5 is ratified (rulings 3.5:G150-G151 and every 3.5 headword’s note); ruling 3.5:G152, maivori includes or excludes the listener by context; zefrolalfo keeps "levitation", and navulalfo becomes "a rise into the sky". With this, every edition is canon.',
    rulings: [g152],
    ops,
  };
}

export function makeChangesets3_5(): LexiconChangeset[] {
  const additions = makeAdditionsChangeset(CONFIG_3_5);
  return [ratify3_5(), additions, author3_5(additions)];
}

function main(): void {
  const { booleans } = parseArgs(process.argv.slice(2), []);
  const all = makeChangesets3_5();
  for (const cs of all) {
    const tally = new Map<string, number>();
    for (const o of cs.ops) tally.set(o.op, (tally.get(o.op) ?? 0) + 1);
    console.log(
      `${cs.id}: ${String(cs.ops.length)} ops ${JSON.stringify(Object.fromEntries(tally))}`,
    );
  }
  if (booleans.has('check')) return;
  all.forEach((cs, i) => {
    writeFileSync(resolve(FILES_3_5[i] ?? ''), `${JSON.stringify(cs, null, 1)}\n`, 'utf8');
    console.log(`wrote ${FILES_3_5[i] ?? ''}`);
  });
}

if (process.argv[1]?.endsWith('make_changeset_3_5.ts')) main();
