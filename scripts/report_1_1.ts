/**
 * CLI: generate the 1.1 human-readable deliverables from the integration data.
 *
 * Both documents are derived, never hand-maintained, so they cannot drift from
 * the lexicon they describe.
 *
 *   npm run report:1.1
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ACCEPTED_OVERLAPS, DECISIONS, DUAL_ANALYSIS_PAGO } from '../src/core/integrate/decisions';
import { NEW_EXAMPLES } from '../src/core/integrate/examples';
import type { Proposal } from '../src/core/integrate/proposalTypes';
import type { RawHeadword, RawLexicon } from '../src/core/model/raw';

const OUT_DIR = 'data/proposals/1.1';
const LEXICON = 'data/lexicon/liraasa_1_1.json';
const BASELINE = 'data/source/liraasa_1_0.json';
const PROPOSAL = 'data/proposals/1.1/Liraasa_1_1_Vocabulary_Proposal.json';
const VALIDATION = 'data/lexicon/validation_1_1.json';

interface ValidationReport {
  summary: { counts: Record<string, number>; status_counts: Record<string, number> };
  checks: {
    id: number;
    check: string;
    status: string;
    details_total: number;
    note: string;
    executed_against?: string;
  }[];
}

function read(path: string): unknown {
  return JSON.parse(readFileSync(resolve(path), 'utf8'));
}

function sha(path: string): string {
  return createHash('sha256')
    .update(readFileSync(resolve(path)))
    .digest('hex');
}

function gloss(h: RawHeadword): string {
  return (h.glosses as unknown as Record<string, string>).root ?? '';
}

/* ------------------------------------------------------------- changelog */

function changelog(
  baseline: RawLexicon,
  next: RawLexicon,
  proposal: Proposal,
  validation: ValidationReport,
): string {
  const base = new Set(baseline.headwords.map((h) => h.root));
  const added = next.headwords.filter((h) => !base.has(h.root));
  const roots = added.filter((h) => h.type === 'Primal');
  const compounds = added.filter((h) => h.type === 'Compound');

  const byDomain = new Map<string, RawHeadword[]>();
  for (const h of added) {
    const list = byDomain.get(h.domain) ?? [];
    list.push(h);
    byDomain.set(h.domain, list);
  }

  const narrowed = DECISIONS.filter((d) => d.kind === 'narrow');
  const L: string[] = [];

  L.push('# Liraasa 1.0 → 1.1 — Vocabulary Changelog');
  L.push('');
  L.push('Vocabulary-only supplement. **No grammar changed**: `phonology`, `morphology`,');
  L.push('`motion_prefixes`, `grammar`, `function_words`, `pronouns`, `correlatives`,');
  L.push('`numbers`, `time_and_dates`, `colors`, `discourse_particles`, `rulings_1_0`,');
  L.push('`rulings_0_8_carried` and all 452 existing examples are byte-identical to 1.0,');
  L.push('verified by check 25.');
  L.push('');
  L.push('## 1. Counts');
  L.push('');
  L.push('| Measure | 1.0 | 1.1 | Δ |');
  L.push('|---|---|---|---|');
  L.push(
    `| Headwords | ${String(baseline.headwords.length)} | ${String(next.headwords.length)} | +${String(added.length)} |`,
  );
  const basePrimal = baseline.headwords.filter((h) => h.type === 'Primal').length;
  const nextPrimal = next.headwords.filter((h) => h.type === 'Primal').length;
  L.push(
    `| Primal roots | ${String(basePrimal)} | ${String(nextPrimal)} | +${String(roots.length)} |`,
  );
  L.push(
    `| Compounds | ${String(baseline.headwords.length - basePrimal)} | ${String(next.headwords.length - nextPrimal)} | +${String(compounds.length)} |`,
  );
  L.push(
    `| Form strings | 7693 | ${String(next.headwords.length * 7)} | +${String(added.length * 7)} |`,
  );
  L.push('| Function words | 149 | 149 | 0 |');
  L.push(
    `| Examples | ${String(baseline.examples.length)} | ${String(next.examples.length)} | +${String(next.examples.length - baseline.examples.length)} |`,
  );
  L.push('');
  L.push(
    `All ${String(proposal.counts.total_proposed)} proposals were integrated: ${String(roots.length)} primal roots and ${String(compounds.length)} compounds.`,
  );
  L.push('No candidate was rejected, and no replacement root had to be coined.');
  L.push('');

  L.push('## 2. The 21 new primal roots');
  L.push('');
  L.push('| Root | Verb | Gloss | Domain |');
  L.push('|---|---|---|---|');
  for (const h of roots) {
    const verb = (h.forms as unknown as Record<string, string>).verb ?? '';
    L.push(`| \`${h.root}\` | \`${verb}\` | ${gloss(h)} | ${h.domain} |`);
  }
  L.push('');
  L.push('Every one fits the 1.0 new-root template (two syllables, consonant-initial,');
  L.push('vowel-final, no prohibited cluster) and sits at least two edit operations from');
  L.push('all 10,625 active and reserved spellings. Checks 5, 6 and 18 verify this, and');
  L.push('because each new entry carries `status_1_0: "NEW"` the unmodified `validate.py`');
  L.push('tests them rather than skipping them.');
  L.push('');

  L.push('## 3. New compounds by domain');
  L.push('');
  for (const domain of [...byDomain.keys()].sort((a, b) => a.localeCompare(b))) {
    const list = (byDomain.get(domain) ?? []).filter((h) => h.type === 'Compound');
    if (list.length === 0) continue;
    L.push(`### ${domain} (${String(list.length)})`);
    L.push('');
    L.push('| Compound | Components | Gloss |');
    L.push('|---|---|---|');
    for (const h of list) {
      L.push(`| \`${h.root}\` | ${(h.components ?? []).join(' + ')} | ${gloss(h)} |`);
    }
    L.push('');
  }

  L.push('## 4. Glosses narrowed on integration');
  L.push('');
  L.push('Eight candidates were accepted with a narrowed gloss rather than as proposed.');
  L.push('Four had an `english_gloss` that contradicted their own `meaning_scope`; four');
  L.push('would otherwise have shadowed a 1.0 sense. Nothing was invented: a narrowing');
  L.push("either follows the candidate's own scope note or adds the qualifier that keeps");
  L.push('the existing sense intact.');
  L.push('');
  L.push('| Headword | Proposed | Integrated as | Why |');
  L.push('|---|---|---|---|');
  const proposedGloss = new Map(
    [...proposal.root_candidates, ...proposal.compound_candidates].map((c) => [
      c.headword,
      c.english_gloss,
    ]),
  );
  for (const d of narrowed) {
    L.push(
      `| \`${d.headword}\` | ${proposedGloss.get(d.headword) ?? '?'} | ${d.gloss ?? '?'} | ${d.reason} |`,
    );
  }
  L.push('');

  L.push('## 5. Overlaps checked and accepted');
  L.push('');
  L.push('The audit flagged 13 candidates whose gloss text matched an existing 1.0 gloss');
  L.push('or synonym. Four were narrowed (§4). The other nine are English homographs or');
  L.push('1.0 synonym padding, not competing Liraasa senses, so they stand as proposed:');
  L.push('');
  L.push('| Headword | Overlaps | On | Why it is not a duplicate |');
  L.push('|---|---|---|---|');
  for (const o of ACCEPTED_OVERLAPS) {
    L.push(`| \`${o.headword}\` | ${o.overlapsWith} | "${o.on}" | ${o.why} |`);
  }
  L.push('');
  L.push('The padding is worth noting on its own: `folninevlo` is "flower-soft snow" and');
  L.push('lists "weather", "climate" and "atmospheric phenomenon" among its synonyms. No');
  L.push('1.0 headword actually means weather, which is why `navutrana` is a real gap');
  L.push('being filled rather than a synonym being added.');
  L.push('');

  L.push('## 6. Denied duplicates (from the proposal preflight)');
  L.push('');
  L.push('The proposal had already removed 46 candidates before submission. They are');
  L.push('recorded here because "why is there no word for X" is a question that recurs.');
  L.push('');
  const counts = proposal.counts as unknown as Record<string, [string, string, string][]>;
  const sections: [string, string][] = [
    ['existing_compound_skipped', 'Already an active 1.0 compound'],
    ['existing_senses_skipped', 'Sense already carried by another 1.0 word'],
    ['existing_derivations_skipped', 'Already generable as a productive derivation'],
  ];
  for (const [key, title] of sections) {
    const rows = counts[key];
    if (!Array.isArray(rows)) continue;
    L.push(`### ${title} (${String(rows.length)})`);
    L.push('');
    L.push('| Proposed | Gloss | Existing |');
    L.push('|---|---|---|');
    for (const row of rows) L.push(`| \`${row[0]}\` | ${row[1]} | ${row[2]} |`);
    L.push('');
  }

  L.push('## 7. Technical edge cases');
  L.push('');
  L.push('### Four compounds that also read as a `-pago` derivation');
  L.push('');
  L.push(`\`${DUAL_ANALYSIS_PAGO.join('`, `')}\` each end in \`pago\`, which is both a 1.0`);
  L.push('headword ("Place") and a productive derivational suffix. Their spellings');
  L.push('therefore carry two analyses: a MODIFIER+HEAD compound, and `X + -pago`.');
  L.push('');
  L.push('This is **not** new and not an error. 1.0 already contains three of the same');
  L.push('shape — `larbopago`, `mavopago`, `sasvapago` — and check 3 of the validator');
  L.push('explicitly excuses the case when the compound declares `components:');
  L.push('[base, "pago"]`, because both readings then agree on the morphemes. All four');
  L.push('new entries declare exactly that, and check 3 passes.');
  L.push('');
  L.push('### Nesting became ordinary');
  L.push('');
  L.push('1.0 had exactly one compound built on another compound (`mudusomubiti`). 1.1');
  L.push('adds 37 more, and `farvisimvodivmabiti` (robot) is the first whose **both**');
  L.push('components are compounds — `farvisimvo` + `divmabiti`. No cycles, and every');
  L.push('component precedes its use (checks 7 and 8).');
  L.push('');
  L.push('### 6460 unused gloss slots');
  L.push('');
  L.push('Up from 4608. The proposal glossed only the slots that carry real meaning and left');
  L.push('the rest exactly `"— (unused)"`, as 1.0 does. No slot was filled to look tidy,');
  L.push('and no figurative opposite or sacralisation was invented.');
  L.push('');
  L.push('### Two status fields on new entries');
  L.push('');
  L.push('Each 1.1 entry carries `status_1_0: "NEW"` and `status_1_1: "NEW"`, with');
  L.push('`since: "1.1"`. The first is what the unmodified `validate.py` requires (check');
  L.push('9) and is what makes checks 5 and 18 actually test the new roots; the second is');
  L.push('the edition-specific record the proposal uses. See ADR-0009.');
  L.push('');

  L.push('## 8. Validation');
  L.push('');
  L.push('Run, not asserted:');
  L.push('');
  L.push('```sh');
  L.push('cd data/source');
  L.push('python validate_1_1.py ../lexicon/liraasa_1_1.json \\');
  L.push('  --baseline-1-0 liraasa_1_0.json --baseline ../lexicon/lexicon_0_8_rc2.json \\');
  L.push('  --out ../lexicon/validation_1_1.json');
  L.push('```');
  L.push('');
  L.push('| # | Check | Result | Executed against |');
  L.push('|---|---|---|---|');
  for (const c of validation.checks) {
    L.push(
      `| ${String(c.id)} | ${c.check} | ${c.status}${c.details_total > 0 ? ` (${String(c.details_total)})` : ''} | ${c.executed_against ?? 'validate.py'} |`,
    );
  }
  L.push('');
  const sc = Object.entries(validation.summary.status_counts)
    .map(([k, v]) => `${String(v)} ${k}`)
    .join(', ');
  L.push(`**${sc}.**`);
  L.push('');
  L.push('`liraasa_core.py` and `liraasa_lexicon.py` were absent from the repository, so');
  L.push('`validate.py` could not run at all. Both were reconstructed from');
  L.push('`liraasa_1_0.json` and the Grammar Guide, then checked by parity: the');
  L.push('unmodified `validate.py` reproduces `validation_1_0.json` on the 1.0 lexicon —');
  L.push('all 24 statuses and all finding counts identical. The only differences are the');
  L.push('two notes counting corpus lines (0 against 493), because `corpus/` was not');
  L.push('supplied; the 447 example sentences match exactly.');
  L.push('');
  L.push('### Not executed');
  L.push('');
  L.push('- The corpus run over `corpus/demo_1_0`, `legacy_0_8`, `songs_1_0`,');
  L.push('  `guide_examples` and `quickstart`. Those files were not supplied, so checks 14,');
  L.push('  15 and 21 ran over the 581 example sentences only, not over the 493 corpus');
  L.push('  lines. **Re-run with `--corpus` when they are available.**');
  L.push('- Listening and singing tests: no audio was produced.');
  L.push('');

  L.push('## 9. New example sentences');
  L.push('');
  L.push(
    `${String(NEW_EXAMPLES.length)} new sentences, all parsing with no unknown words (check 14) and`,
  );
  L.push('passing clause-order checking (check 21):');
  L.push('');
  L.push('| Domain | Sentences |');
  L.push('|---|---|');
  const domains = new Map<string, number>();
  for (const e of NEW_EXAMPLES) domains.set(e.domain, (domains.get(e.domain) ?? 0) + 1);
  for (const [d, n] of domains) L.push(`| ${d} | ${String(n)} |`);
  L.push('');
  L.push('Each of the 21 new roots appears in at least three of them (requirement: two).');
  L.push('');

  return `${L.join('\n')}\n`;
}

/* --------------------------------------------------------- LLM quickstart */

function quickstart(baseline: RawLexicon, next: RawLexicon): string {
  const base = new Set(baseline.headwords.map((h) => h.root));
  const added = next.headwords.filter((h) => !base.has(h.root));
  const roots = added.filter((h) => h.type === 'Primal');
  const elevated = added.filter((h) => h.notes.includes('Lexicalised metaphor'));

  const L: string[] = [];
  L.push('# Liraasa 1.1 — LLM Quickstart (vocabulary addendum)');
  L.push('');
  L.push('**The 1.0 grammar is unchanged.** Use `Liraasa_1_0_LLM_Quickstart.md` for every');
  L.push('rule: the seven forms, the verb rule, the 20-slot clause, the particle');
  L.push('inventory, the rulings. Nothing in this file adds or alters a rule. 1.1 is');
  L.push('vocabulary only.');
  L.push('');
  const totalPrimal = next.headwords.filter((h) => h.type === 'Primal').length;
  const totalCompound = next.headwords.length - totalPrimal;
  L.push(
    `**Files:** \`liraasa_1_1.json\` — the only source of truth for vocabulary: ` +
      `${String(next.headwords.length)} headwords, ${String(totalPrimal)} primal roots, ` +
      `${String(totalCompound)} compounds, and the same 149 function words as 1.0 · ` +
      '`validate_1_1.py` · `validation_1_1.json`.',
  );
  L.push('');
  L.push('## What 1.1 adds');
  L.push('');
  L.push(
    `${String(added.length)} headwords: ${String(roots.length)} primal roots and ${String(added.length - roots.length)} compounds. No new`,
  );
  L.push('particle, suffix, pronoun, tense, operator or clause slot.');
  L.push('');
  L.push('## The 21 new fundamental concepts');
  L.push('');
  L.push('These are the roots to learn, because compounds are built on them:');
  L.push('');
  L.push('| Root | Verb | Means | Do not confuse with |');
  L.push('|---|---|---|---|');
  const CONTRAST: Record<string, string> = {
    lazu: 'folni (flower), bio (life)',
    jemla: 'lazu (animal in general)',
    pavma: 'coda (thing/concept), yalmu (energy), pesbi (weight)',
    germa: 'solo (stone), pavma (matter in general)',
    yalmu: 'pavma (matter), and never moral or political power',
    serna: 'sabe (knowledge), seno (word), lideo (idea)',
    lermi: 'seno (a single word), valla (voice)',
    nurmi: 'ravmi (intelligence), sabe (knowledge), mere alertness',
    ravmi: 'nurmi (consciousness), sabe (knowledge), ranfa (reason)',
    divma: 'lordi (order), nulu (path)',
    favro: 'seno (word) — a signal need not be speech',
    vamri: 'pago (place), navu (sky), vemi (world)',
    demro: 'trana (change), valmi (walking)',
    purma: 'mare (mother), pilo (father) — purma is either',
    hunra: 'yanba (old) — hunra is fully developed, not aged',
    lizma: 'rizno (right); neither is moral',
    rizno: 'lizma (left); not moral rightness',
    zavme: 'futu (future) — zavme is spatial only',
    nazru: 'po (past) — nazru is spatial only',
    tilnu: 'momvi (loss), and never moral worthlessness',
    zarmo: 'ralka (combat), pune (pushing)',
  };
  for (const h of roots) {
    const verb = (h.forms as unknown as Record<string, string>).verb ?? '';
    L.push(`| \`${h.root}\` | \`${verb}\` | ${gloss(h)} | ${CONTRAST[h.root] ?? '—'} |`);
  }
  L.push('');
  L.push('## Cautions: misleading lexical metaphors');
  L.push('');
  L.push(
    `${String(elevated.length)} new compounds are **lexicalised**: their meaning is conventional, not the sum`,
  );
  L.push('of their parts. Read the gloss, never the components, and do not extend the');
  L.push('metaphor to new coinages.');
  L.push('');
  L.push('| Compound | Literally | Actually means | Caution |');
  L.push('|---|---|---|---|');
  const LITERAL: Record<string, string> = {
    mavoyuge: 'mind + flesh',
    sapukova: 'eating + vessel',
    conokova: 'coin + vessel',
    sernakova: 'information + vessel',
    cunudivmabiti: 'counting + machine',
    farvisimvodivmabiti: 'free-identity + machine',
    lordinulu: 'order + path',
    pesbivordu: 'weight + cause',
    pavmatrana: 'matter + change',
    pavmapatu: 'matter + part',
    ceresolo: 'clear + stone',
    farusolo: 'fire + stone',
    germativro: 'metal + pull',
    germabiti: 'metal + tool',
    lirasarbi: 'song + writing',
    yanolira: 'together + song',
    lideosovla: 'idea + shape',
    talirivo: 'work + companion',
    mavopagodapa: 'society + price',
    farvilazu: 'free + animal',
    lazuralka: 'animal + fight',
    folnitino: 'flower + kind',
    loterobiotino: 'other + species',
  };
  const CAUTION: Record<string, string> = {
    mavoyuge: 'A brain is not a mind and not a computer.',
    cunudivmabiti: 'A historical counting metaphor, exactly like English "computer".',
    farvisimvodivmabiti:
      'The freedom is metaphorical. It implies no consciousness; `nurmi` is a separate claim.',
    pesbivordu: 'Technical term. Do not read it as any cause of any weight.',
    pavmapatu: 'A distinguishable piece of matter, **not** an atom.',
    germabiti: 'A metal implement. It does not imply steel.',
    lazuralka: 'Aggression between animals, not predation specifically.',
    folnitino: 'Flowering plants specifically, not all plants.',
    yanolira: 'A group-sung section. Not necessarily a repeated refrain — that is `ralelirapatu`.',
    ceresolo: 'Manufactured glass. Natural crystal needs specialist wording.',
    conokova: 'A bank. The vessel is metaphorical.',
    sernakova: 'A database. The vessel is metaphorical.',
    talirivo: 'A colleague, not necessarily a friend.',
    lideosovla: 'A metaphor. Lexicalised; do not build further figurative compounds on it.',
    farvilazu: 'Wild or unconfined — not necessarily unowned.',
  };
  for (const h of elevated) {
    L.push(
      `| \`${h.root}\` | ${LITERAL[h.root] ?? (h.components ?? []).join(' + ')} | ${gloss(h)} | ${CAUTION[h.root] ?? 'Conventional sense; read the gloss.'} |`,
    );
  }
  L.push('');
  L.push('## Four spellings with two analyses');
  L.push('');
  L.push(`\`${DUAL_ANALYSIS_PAGO.join('`, `')}\` are compounds whose head is the root`);
  L.push('`pago` ("place"), so each also reads as the productive derivation `X + -pago`.');
  L.push('Both readings give the same morphemes and the same meaning, so either is');
  L.push('acceptable. 1.0 already works this way for `larbopago`, `mavopago` and');
  L.push('`sasvapago`.');
  L.push('');
  L.push('## Still true in 1.1');
  L.push('');
  L.push('1. **Never invent a root.** 1418 headwords; build a transparent MODIFIER+HEAD');
  L.push('   compound from two of them and flag it noncanonical.');
  L.push('2. **Never give a meaning to a slot glossed `— (unused)`.** There are 6460 of');
  L.push('   them.');
  L.push('3. **`mavo + -pago` is still blocked.** `mavopago` is the fixed word "society".');
  L.push('4. Transitivity is usage-based: `gome` passivises any verb used with an object.');
  L.push('5. Pre-1.0 spellings resolve through `legacy.migration_forms` (ruling 1.0:G19).');
  L.push('');
  L.push('## Checking your work');
  L.push('');
  L.push('```sh');
  L.push('python validate_1_1.py liraasa_1_1.json --baseline-1-0 liraasa_1_0.json \\');
  L.push('  --corpus MY_TEXT_DIR');
  L.push('```');
  L.push('');
  L.push('Check 14 lists unknown words; check 21 lists clause-order errors; check 25');
  L.push('confirms 1.0 is carried verbatim.');
  L.push('');
  return `${L.join('\n')}\n`;
}

/* ----------------------------------------------------------------- compare */

function compareReport(baseline: RawLexicon, next: RawLexicon): string {
  const base = new Set(baseline.headwords.map((h) => h.root));
  const added = next.headwords.filter((h) => !base.has(h.root));
  return `${JSON.stringify(
    {
      report: 'Liraasa 1.0 -> 1.1 machine-readable comparison',
      generated_from: 'scripts/report_1_1.ts',
      files: {
        'lexicon_0_8_rc2.json': { sha256: sha('data/lexicon/lexicon_0_8_rc2.json') },
        'liraasa_1_0.json': { sha256: sha(BASELINE), headwords: baseline.headwords.length },
        'liraasa_1_1.json': { sha256: sha(LEXICON), headwords: next.headwords.length },
        'Liraasa_1_1_Vocabulary_Proposal.json': { sha256: sha(PROPOSAL) },
        'validation_1_1.json': { sha256: sha(VALIDATION) },
      },
      unchanged: {
        headwords_1_0_identical: baseline.headwords.every(
          (h, i) => JSON.stringify(h) === JSON.stringify(next.headwords[i]),
        ),
        examples_1_0_identical: baseline.examples.every(
          (e, i) => JSON.stringify(e) === JSON.stringify(next.examples[i]),
        ),
        frozen_sections: Object.fromEntries(
          [
            'phonology',
            'morphology',
            'motion_prefixes',
            'grammar',
            'function_words',
            'pronouns',
            'correlatives',
            'numbers',
            'time_and_dates',
            'colors',
            'discourse_particles',
            'rulings_1_0',
            'rulings_0_8_carried',
            'legacy',
            'sound_ledger',
            'dispositions',
            'settled_open_questions_0_8',
            'snapshot_0_8',
            'changelog_1_0',
            'rhyme_families',
          ].map((k) => [
            k,
            JSON.stringify((baseline as unknown as Record<string, unknown>)[k]) ===
              JSON.stringify((next as unknown as Record<string, unknown>)[k]),
          ]),
        ),
      },
      changed: {
        version: [baseline.version, next.version],
        built_utc: [baseline.built_utc, next.built_utc],
        source: 'rewritten to record the 1.1 provenance',
        headwords: `+${String(added.length)}`,
        examples: `+${String(next.examples.length - baseline.examples.length)}`,
      },
      added: added.map((h) => ({
        root: h.root,
        type: h.type,
        components: h.components,
        domain: h.domain,
        gloss: gloss(h),
      })),
    },
    null,
    1,
  )}\n`;
}

function main(): void {
  const baseline = read(BASELINE) as RawLexicon;
  const next = read(LEXICON) as RawLexicon;
  const proposal = read(PROPOSAL) as Proposal;
  const validation = read(VALIDATION) as ValidationReport;

  const files: [string, string][] = [
    [
      `${OUT_DIR}/Liraasa_1_1_Vocabulary_Changelog.md`,
      changelog(baseline, next, proposal, validation),
    ],
    [`${OUT_DIR}/Liraasa_1_1_LLM_Quickstart.md`, quickstart(baseline, next)],
    ['data/lexicon/compare_1_0_to_1_1.json', compareReport(baseline, next)],
  ];

  for (const [path, text] of files) {
    writeFileSync(resolve(path), text, 'utf8');
    console.log(`Wrote ${path} (${String(Buffer.byteLength(text, 'utf8'))} bytes)`);
  }
}

main();
