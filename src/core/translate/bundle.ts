/**
 * What the browser bundle (editor/grammar/grammar-core.js, window.LiraasaGrammar)
 * exposes: the strict checker and the translator (2.5, ADR-0020).
 */
export { createChecker, tokenize } from '../grammar';
export { createTranslator, fromParse, realize, signature } from './index';
