/**
 * How a word sounds, for the guide's tables: syllables, stress and IPA, read
 * from the Workbench's own phonetics (the same rules as the MFA export).
 */
import { markStress, syllabify } from '../../src/core/phonetics/g2p';
import { esc } from './html';

/** `lu-MI-la`, then IPA with syllable dots and the stress mark, then the count. */
export function sound(word: string): string {
  const { syllables, stressIndex } = syllabify(word);
  const ipa = syllables
    .map((syl, i) => (i === stressIndex && syllables.length > 1 ? 'ˈ' : '') + syl.phones.join(''))
    .join('.');
  return `<span class="sound"><span class="stress">${esc(markStress(word))}</span> <span class="ipa">/${esc(
    ipa,
  )}/</span> <span class="syl">${String(syllables.length)} syl.</span></span>`;
}
