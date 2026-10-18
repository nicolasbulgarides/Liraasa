import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  AUDIO_DIR,
  audioCoverage,
  buildLearnData,
  readAudioManifest,
  type LearnData,
} from '@core/learn';
import { loadLearnInput } from '../../scripts/learn_inputs';

let data: LearnData;
let root: string;
let compound: string;
let sentence: string;

beforeAll(() => {
  data = buildLearnData(loadLearnInput());
  const items = [...data.items.values()];
  root = items.find((i) => i.kind === 'root')?.id ?? '';
  compound = items.find((i) => i.kind === 'compound')?.id ?? '';
  sentence = data.examples[0]?.key ?? '';
});

describe('the audio manifest', () => {
  it('ships empty and well formed', () => {
    const raw: unknown = JSON.parse(readFileSync(`${AUDIO_DIR}/manifest.json`, 'utf8'));
    expect(readAudioManifest(raw, data)).toEqual({ files: {}, unknownKeys: [], badPaths: [] });
  });

  it('keeps words and sentences by key, and reports what it cannot use', () => {
    const check = readAudioManifest(
      {
        files: {
          [root]: 'words/a.mp3',
          [sentence]: 'lines/b.ogg',
          lx_nothing_9999: 'c.mp3',
          [compound]: '../outside.mp3',
        },
      },
      data,
    );
    expect(check.files).toEqual({ [root]: 'words/a.mp3', [sentence]: 'lines/b.ogg' });
    expect(check.unknownKeys).toEqual(['lx_nothing_9999']);
    expect(check.badPaths).toEqual([compound]);
  });

  it('refuses absolute paths, drive letters and backslashes', () => {
    for (const path of ['/a.mp3', 'C:/a.mp3', 'a\\b.mp3', '', 'https://x/a.mp3']) {
      expect(readAudioManifest({ files: { [root]: path } }, data).badPaths).toEqual([root]);
    }
  });

  it('reads a malformed manifest as empty', () => {
    for (const raw of [undefined, null, 3, { files: 'no' }]) {
      expect(readAudioManifest(raw, data).files).toEqual({});
    }
  });
});

describe('audio coverage', () => {
  it('counts roots, compounds and sentences', () => {
    const c = audioCoverage(data, new Set([root, compound, sentence]));
    expect(c.roots.have).toBe(1);
    expect(c.compounds.have).toBe(1);
    expect(c.sentences.have).toBe(1);
    expect(c.roots.total + c.compounds.total).toBe(c.missing.length + 2);
    expect(c.missing).not.toContain(root);
  });

  it('lists roots before compounds, the most used first', () => {
    const c = audioCoverage(data, new Set());
    const kinds = c.missing.map((id) => data.items.get(id)?.kind);
    const firstCompound = kinds.indexOf('compound');
    expect(kinds.slice(0, firstCompound).every((k) => k === 'root')).toBe(true);
    expect(kinds.slice(firstCompound).every((k) => k === 'compound')).toBe(true);
    const use = (id: string) => {
      const f = data.frequency.get(id);
      return (f?.corpus ?? 0) + (f?.examples ?? 0) + (data.items.get(id)?.usedIn.length ?? 0);
    };
    const roots = c.missing.slice(0, firstCompound).map(use);
    expect(roots).toEqual([...roots].sort((a, b) => b - a));
  });

  it('never counts an attested image compound or a closed word as a headword to record', () => {
    const c = audioCoverage(data, new Set());
    for (const id of c.missing) {
      expect(['root', 'compound']).toContain(data.items.get(id)?.kind);
    }
  });
});
