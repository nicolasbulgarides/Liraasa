/**
 * The strict checker (2.5, ADR-0020): read every word, parse every sentence
 * against the 2.5 templates, name the rule of every finding.
 */
export { createChecker, tokenize, type Checker, type LineResult } from './check';
export { buildIndex, verbRule, type GrammarSource, type Index, type Reference } from './lexicon';
export { readWord } from './reader';
export type * from './types';
