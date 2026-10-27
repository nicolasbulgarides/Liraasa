/**
 * Editions whose additions await the author's ratification. None: the author
 * ratified 3.1 (ADR-0023), then 3.0, 3.3 and 3.4, then 3.5, all on 2026-10-25
 * (ADR-0025, ADR-0026). 3.6, the 2100 Dreams patch, is proposed (ADR-0027). A new patch's edition goes here until it is ratified. The LLM reference flags these
 * editions' words "new in <edition>" and says so in its edition_status; the
 * tests read the same list.
 */
export const PROPOSED_EDITIONS: readonly string[] = [];
