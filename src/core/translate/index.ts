/**
 * The English → Liraasa translator (2.5, ADR-0020): English → meaning frame →
 * Liraasa structure → the strict checker → back-translation.
 */
export {
  createTranslator,
  signature,
  type SentenceTranslation,
  type TranslateSource,
} from './pipeline';
export { createEnglishReader, type EnglishData, type MeaningSentence } from './english';
export { fromParse } from './fromParse';
export { realize, realizeClause, realizeNP } from './realize';
export { buildEnglishIndex, senses } from './lexchoice';
export type * from './frame';
