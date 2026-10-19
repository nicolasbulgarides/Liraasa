import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { type Checker, type Diagnostic, loadChecker } from './loadChecker';

/**
 * The grammar audit's decisions (2.3:G72–G76, ADR-0019 addendum): the album's
 * consistent usage is grammar, and a ki-eli / ki-muya question ends in ki.
 * Every example reads clean, the album reads with no finding but the one
 * reading that departs once (AR-10), and the checker's false positives on
 * album lines are gone.
 */

const read = (path: string): unknown =>
  JSON.parse(readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8'));
const lexicon = read('../../data/lexicon/liraasa_2_3.json') as {
  rulings_2_3: { id: string; examples: [string, string][] }[];
};
const album = read('../../data/corpus/album_2_0/album_current.json') as {
  songs: { track: string; lines: { n: number; recorded: string; current: string | null }[] }[];
};

let checker: Checker;
beforeAll(() => {
  checker = loadChecker().checker;
});

const serious = (line: string): Diagnostic[] =>
  checker.checkLine(line, 1).filter((d) => d.severity === 'error' || d.severity === 'warn');
const all = (line: string, rule: string): Diagnostic[] =>
  checker.checkLine(line, 1).filter((d) => d.rule === rule);

describe('the audit rulings 2.3:G72–G86', () => {
  it('give examples, and every one reads clean', () => {
    const lines = lexicon.rulings_2_3
      .filter((r) => Number(r.id.slice(1)) >= 72)
      .flatMap((r) => r.examples.map(([l]) => l));
    expect(lines.length).toBe(20);
    for (const line of lines) expect(serious(line), line).toEqual([]);
  });

  it('the album reads clean but for its one remaining reading, AR-10', () => {
    const found = album.songs.flatMap((s) =>
      s.lines.flatMap((l) =>
        serious(l.current ?? l.recorded).map((d) => `${s.track}:${String(l.n)} ${d.rule}`),
      ),
    );
    expect(found).toEqual(['08:15 sidu']);
  });
});

describe('the album as grammar', () => {
  it('ata may open a line (2.3:G72)', () => {
    expect(checker.checkLine('ata maivo lemula saivo de sizosan lumi.', 1)).toEqual([]);
  });

  it('en / ko + an abstract noun is noted as the manner, with yuta for the means (2.3:G73)', () => {
    const [d] = all('maivo futu sulnosia ko amor.', '2.3:G73');
    expect(d?.severity).toBe('note');
    expect(d?.fix).toBe('yuta');
    // a substance with ko is still the misused instrument
    expect(all('maivo lisila taivo ko li miru.', '1.2:G33')[0]?.severity).toBe('warn');
  });

  it('raho may open a question, which ends in ki (2.3:G74)', () => {
    expect(serious('raho povi sabesia baba kasi polvasan sove ki?')).toEqual([]);
    expect(serious('raho povi sabesia baba kasi polvasan sove?')[0]?.rule).toBe('2.3:G74');
  });

  it('pagopa takes the motion prefixes (2.3:G75)', () => {
    expect(all('taivo ne taro-pagopa.', '1.2:G35')).toEqual([]);
    // another verb still asks
    expect(all('maivo taro-lirala.', '1.2:G35')).toHaveLength(1);
  });

  it('a ki-eli / ki-muya + noun question ends in ki (2.3:G76)', () => {
    expect(serious('Taivo amora ki-eli lira ki?')).toEqual([]);
    expect(serious('Ki-eli lira taivo amora?')[0]?.rule).toBe('2.3:G76');
    expect(serious('Ki-eli nullo!')).toEqual([]); // the exclamation (2.2:G61)
    expect(serious('Ki-pago taivo pagopa?')).toEqual([]); // other ki-words may omit ki (2.2:G60)
  });
});

describe('album lines the checker misread', () => {
  it('gase + noun + raho is a simile, not a clause (0.8:G8)', () => {
    expect(all('ata maivori po revo-lirala gase raleri raho ne ravmira.', '0.8:G8')).toEqual([]);
    // a line-opening gase clause is comparison only: reported (grammar audit K03)
    expect(all('Gase maivo lirala, taivo rilura.', '0.8:G8')).toHaveLength(1);
  });

  it('existential miyo opens a question (slot 14)', () => {
    expect(serious('miyo baba kasi sovesan sonbu ki?')).toEqual([]);
    expect(all('Ka taivo benasan ki?', 'ki')).toHaveLength(1);
  });

  it('ne A ne B with no verb is a fragment (1.0:G10, 0.8:G3)', () => {
    expect(serious('Ne codana, ne kronona — ola ka veraasa!')).toEqual([]);
  });

  it('a verbless list of operator words is not two words in one slot', () => {
    expect(serious('Yehu, gesu, bisu, vuda — maivo de sabe ka veraasa:')).toEqual([]);
    expect(all('Maivo yehu gesu lirala.', '1.0:G16')).toHaveLength(1);
  });
});
