/**
 * Editions whose additions await the author's ratification (ADR-0021,
 * ADR-0023, ADR-0024). 3.1 is not among them: the author ratified it on 2026-10-25.
 * The LLM reference flags their words "new in <edition>" and says so in its
 * edition_status; the tests read the same list.
 */
export const PROPOSED_EDITIONS: readonly string[] = ['3.0', '3.3', '3.4'];
