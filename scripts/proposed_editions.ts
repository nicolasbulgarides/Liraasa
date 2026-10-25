/**
 * Editions whose additions await the author's ratification (ADR-0025).
 * Everything up to 3.4 is ratified: 3.1 on 2026-10-25 (ADR-0023), 3.0, 3.3
 * and 3.4 on the same day (ADR-0025). The LLM reference flags these
 * editions' words "new in <edition>" and says so in its edition_status; the
 * tests read the same list.
 */
export const PROPOSED_EDITIONS: readonly string[] = ['3.5'];
