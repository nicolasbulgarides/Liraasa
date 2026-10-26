/**
 * One-time tool: the changeset `npm run integrate:3.6` applies to frozen 3.5
 * (ADR-0027).
 *
 *   npx tsx scripts/make_changeset_3_6.ts           # write it
 *   npx tsx scripts/make_changeset_3_6.ts --check   # build, write nothing
 *
 * The 3.6 patch, "The 2100 Dreams patch: robots, the mind, the neocity"
 * (archived whole in archive/patch_3_6/, with its checksums), is modular, like
 * 3.5. Every module is installed, as the author's own build does: core, mind,
 * world, nature, register and book.2100. It adds two roots (kibo, robot; garza,
 * the coarse curse), 140 compounds, 10 derivations, 7 diminutives, 1 restored
 * form, 59 English aliases and rulings 3.6:G152 (the -san of a lexicalised
 * diminutive), G153 (coarse register) and G154 (metric units), each entry
 * noting its tier and module. Its recipes go into the guide; its name sheet is
 * reference data for translators and is not a lexicon entry.
 *
 * The author's decisions on the patch (2026-10-25, ADR-0027) are applied to
 * it as read (`decide3_6`), never to its file, and the decided patch is written
 * to data/proposals/liraasa_3_6_patch_decided.json for the author's validator:
 *
 *   - its rulings are renumbered 3.6:G153-G155, since 3.5:G152 (maivori) took
 *     G152 after the bundle was made;
 *   - lavipavma and sovepavma are dropped: dopamine and serotonin are copied
 *     as scientific names (dopamina, serotonina, 3.5:G151);
 *   - the novel's sound-words and slang are built from existing words: seven
 *     compounds, and wazoop is the attested image compound vayesonbu, made a
 *     headword with its old reading kept in its gloss.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { LexiconChangeset } from '../src/core/change/apply';
import { parseArgs } from './args';
import { type AdditionsConfig, type Patch, makeAdditionsChangeset } from './make_changeset_3_0';
import { WORD_BUILDING_3_5 } from './make_changeset_3_5';

export const ID_3_6 = '2026-10-25-lexicon-3-6';
export const FILES_3_6 = [`data/changes/${ID_3_6}.json`] as const;
const BASELINE = 'data/lexicon/liraasa_3_5.json';

/** 3.6 builds words as 3.5 does. */
export const WORD_BUILDING_3_6 = WORD_BUILDING_3_5;
const AT = '2026-10-25T23:00:00Z';
const EDITION = '3.6';

export const DECIDED_PATCH_3_6 = 'data/proposals/liraasa_3_6_patch_decided.json';
/** The patch's ruling ids, renumbered past 3.5:G152 (the author, 2026-10-25). */
export const RENUMBER_3_6: Readonly<Record<string, string>> = {
  G152: 'G153',
  G153: 'G154',
  G154: 'G155',
};
const DROPPED = ['lavipavma', 'sovepavma'];
const DECIDED_NOTE =
  'Built from existing words at the author’s request (2026-10-25): a sound-word or slang term of 2100 Dreams.';
const coinage = (
  headword: string,
  parts: [string, string],
  domain: string,
  forms: Record<string, { form: string; meaning: string }>,
): Patch['compounds_add'][number] => ({
  module: 'book.2100',
  headword,
  parts,
  domain,
  tier: 2,
  image_compound: false,
  title: false,
  forms,
  note: DECIDED_NOTE,
});
/** The coinages for the novel's own words, each from two headwords (or a colour base). */
const COINAGES: Patch['compounds_add'] = [
  coinage('lunovurfa', ['luno', 'vurfa'], 'Animals', {
    n: { form: 'lunovurfa', meaning: 'moonfox (a genetically engineered fox)' },
  }),
  coinage('pelipebuvelma', ['peli', 'pebuvelma'], 'Clothing & adornment', {
    n: { form: 'pelipebuvelma', meaning: 'sneakerette; a trendy sneaker (play-shoe)' },
  }),
  coinage('kibosonbu', ['kibo', 'sonbu'], 'Information & technology', {
    n: { form: 'kibosonbu', meaning: 'zeep zoop; a robot’s chime (robot-sound)' },
  }),
  coinage('linuvalmi', ['linu', 'valmi'], 'Body & movement', {
    n: { form: 'linuvalmi', meaning: 'toddling; a tottle (child-walk)' },
    v: { form: 'linuvalmila', meaning: 'to tottle along; to toddle' },
  }),
  coinage('mirufarvibudi', ['miru', 'farvibudi'], 'Animals', {
    n: { form: 'mirufarvibudi', meaning: 'hydrocune (a water-wolf of legend)' },
  }),
  coinage('lumiyelmi', ['lumi', 'yelmi'], 'Language & art', {
    n: { form: 'lumiyelmi', meaning: 'zazzle; flair; dazzle (light-glitter)' },
  }),
  // wazoop: the attested image compound vayesonbu, lexicalised with its reading kept
  coinage('vayesonbu', ['vaye', 'sonbu'], 'Language & art', {
    n: { form: 'vayesonbu', meaning: 'wazoop; whoosh; a wind-carried sound' },
  }),
  coinage('auruminela', ['aurumi', 'nela'], 'Society & people', {
    n: { form: 'auruminela', meaning: 'a goldie; one of the gilded rich (gold-person)' },
  }),
];

/** The author's decisions on the 3.6 patch (2026-10-25), applied to the patch as read. */
export function decide3_6(read: Patch): Patch {
  // renumber every ruling reference of the patch's own, highest first (the patch predates 3.5:G152)
  let text = JSON.stringify(read);
  for (const [from, to] of Object.entries(RENUMBER_3_6).reverse())
    text = text.replace(new RegExp(`\\b${from}\\b`, 'g'), to);
  const p = JSON.parse(text) as Patch & {
    names_sheet?: unknown;
    recipes_add?: unknown;
    test_sentences?: unknown;
  };
  const before = p.compounds_add.length;
  p.compounds_add = p.compounds_add.filter((c) => !DROPPED.includes(c.headword));
  if (p.compounds_add.length !== before - DROPPED.length)
    throw new Error(`3.6: expected to drop ${DROPPED.join(', ')}`);
  p.compounds_add.push(...COINAGES);
  const forms = (es: { forms: Record<string, unknown> }[]): number =>
    es.reduce((n, e) => n + Object.keys(e.forms).length, 0);
  p.counts = {
    ...p.counts,
    new_compounds: p.compounds_add.length,
    headwords_after: p.base_counts.headwords + p.roots_add.length + p.compounds_add.length,
    meaningful_forms_after:
      p.base_counts.meaningful_forms +
      forms(p.roots_add) +
      forms(p.compounds_add) +
      p.restored_forms_add.length,
  };
  return p;
}

export const CONFIG_3_6: AdditionsConfig = {
  patch: 'archive/patch_3_6/patches/liraasa_3_6_patch.json',
  baseline: BASELINE,
  edition: EDITION,
  previous: '3.5',
  at: AT,
  id: ID_3_6,
  name: 'Liraasa 3.6 patch (The 2100 Dreams patch)',
  wordBuilding: WORD_BUILDING_3_6,
  patchTransform: decide3_6,
  summary: (patch) =>
    `Liraasa 3.6, "The 2100 Dreams patch: robots, the mind, the neocity" (ADR-0027), from the author's 3.6 patch, every module installed. PROPOSED: ${patch.status}. ` +
    `Additions only: ${String(patch.roots_add.length)} roots (kibo, garza), rulings 3.6:G153-G155 (renumbered past 3.5:G152); ${String(patch.compounds_add.length)} compounds (lavipavma and sovepavma dropped for the copied scientific names, seven coinages for the novel's sound-words and slang), ` +
    `${String(patch.listed_derivations_add.length)} listed derivations, ${String(patch.lexicalised_diminutives_add.length)} lexicalised diminutives, ` +
    `${String(patch.restored_forms_add.length)} restored forms and ${String((patch.english_aliases_add ?? []).length)} English aliases, each entry noted with its tier and module. ` +
    'No 3.5 word, spelling or ruling changes.',
};

export function makeChangesets3_6(): LexiconChangeset[] {
  return [makeAdditionsChangeset(CONFIG_3_6)];
}

function main(): void {
  const { booleans } = parseArgs(process.argv.slice(2), []);
  const all = makeChangesets3_6();
  for (const cs of all) {
    const tally = new Map<string, number>();
    for (const o of cs.ops) tally.set(o.op, (tally.get(o.op) ?? 0) + 1);
    console.log(
      `${cs.id}: ${String(cs.ops.length)} ops ${JSON.stringify(Object.fromEntries(tally))}`,
    );
  }
  if (booleans.has('check')) return;
  mkdirSync(resolve('data/proposals'), { recursive: true });
  writeFileSync(
    resolve(DECIDED_PATCH_3_6),
    `${JSON.stringify(decide3_6(JSON.parse(readFileSync(resolve(CONFIG_3_6.patch), 'utf8')) as Patch), null, 1)}\n`,
    'utf8',
  );
  console.log(`wrote ${DECIDED_PATCH_3_6}`);
  all.forEach((cs, i) => {
    writeFileSync(resolve(FILES_3_6[i] ?? ''), `${JSON.stringify(cs, null, 1)}\n`, 'utf8');
    console.log(`wrote ${FILES_3_6[i] ?? ''}`);
  });
}

if (process.argv[1]?.endsWith('make_changeset_3_6.ts')) main();
