/**
 * The 1.1 vocabulary proposal file, as supplied.
 *
 * Vocabulary only: the proposal touches no grammar, and the integration must
 * not either.
 */
import type { RawSlots } from '../model/raw';

export interface ProposedRoot {
  headword: string;
  type: 'Primal';
  english_gloss: string;
  semantic_scope: string;
  domain: string;
  register: string;
  status_1_1: string;
  no_grammar_change: boolean;
  proposed_forms: RawSlots;
  proposed_glosses: RawSlots;
  synonym_policy: string;
  protected: boolean;
  [key: string]: unknown;
}

export interface ProposedCompound {
  headword: string;
  type: 'Compound';
  components: [string, string];
  english_gloss: string;
  meaning_scope: string;
  semantic_status: string;
  domain: string;
  register: string;
  status_1_1: string;
  requires_author_review: boolean;
  proposed_forms: RawSlots;
  proposed_glosses: RawSlots;
  synonym_policy: string;
  protected: boolean;
  semantic_risk: 'STANDARD' | 'ELEVATED';
  overlap_warning?: string;
  [key: string]: unknown;
}

export type ProposedEntry = ProposedRoot | ProposedCompound;

export interface Proposal {
  project: string;
  proposal_version: string;
  source_lexicon: string;
  source_lexicon_sha256: string;
  intent: string;
  counts: {
    new_primal_roots: number;
    new_compounds: number;
    total_proposed: number;
    baseline_headwords: number;
    post_integration_headwords: number;
    post_primal_roots: number;
    post_compounds: number;
    [key: string]: unknown;
  };
  root_candidates: ProposedRoot[];
  compound_candidates: ProposedCompound[];
  /** Dependency-safe insertion order: every component appears before its use. */
  safe_integration_order: string[];
  editorial_policies: string[];
}

export function isCompound(entry: ProposedEntry): entry is ProposedCompound {
  return entry.type === 'Compound';
}
