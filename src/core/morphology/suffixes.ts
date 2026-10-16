/**
 * The suffix stack: `ROOT + (one form OR one derivation) + -ti + -ri`.
 *
 * A form and a derivation never combine (settled question 4), and `-ri` is
 * always last.
 */
import {
  DERIVATIONS,
  isBlockedDerivation,
  LEXICALISED_DERIVATIONS,
  type DerivationKey,
} from '../config/morphology';
import { formOf } from './sevenForms';
import type { FormSlot } from '../config/slots';

/** What sits between the root and `-ti`: one form, or one derivation, or neither. */
export type Stem =
  | { kind: 'form'; slot: FormSlot }
  | { kind: 'derivation'; derivation: DerivationKey };

export interface WordSpec {
  root: string;
  /** Omit for the bare root. */
  stem?: Stem;
  diminutive?: boolean;
  plural?: boolean;
}

export class SuffixError extends Error {}

/**
 * Assemble a surface form from a spec.
 *
 * @throws SuffixError if the spec asks for a blocked derivation.
 */
export function assemble(spec: WordSpec): string {
  let out: string;

  if (spec.stem === undefined) {
    out = spec.root;
  } else if (spec.stem.kind === 'form') {
    out = formOf(spec.root, spec.stem.slot);
  } else {
    const { derivation } = spec.stem;
    if (isBlockedDerivation(spec.root, derivation)) {
      throw new SuffixError(
        `${spec.root} + -${derivation} is blocked` +
          (spec.root === 'mavo' ? '; mavopago is the fixed word "society"' : ''),
      );
    }
    out = spec.root + DERIVATIONS[derivation].spelling;
  }

  if (spec.diminutive === true) out += 'ti';
  if (spec.plural === true) out += 'ri';
  return out;
}

/** Build a derivation, or `null` when it is blocked. */
export function deriveOrNull(root: string, derivation: DerivationKey): string | null {
  if (isBlockedDerivation(root, derivation)) return null;
  return root + DERIVATIONS[derivation].spelling;
}

/**
 * The fixed gloss of a lexicalised derivation, if it has one (1.0:G20).
 * A caller must prefer this over any compositional reading.
 */
export function lexicalisedGloss(spelling: string): string | undefined {
  return LEXICALISED_DERIVATIONS[spelling];
}
