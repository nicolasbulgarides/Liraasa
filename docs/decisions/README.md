# Architecture decision records

One file per decision, numbered, newest at the bottom. A decision that is
later reversed gets a new ADR and the old one's status changes to
`superseded by ADR-NNNN`; the old file stays, because the reasoning is the
point.

| #                                             | Decision                                                           | Status   | Phase |
| --------------------------------------------- | ------------------------------------------------------------------ | -------- | ----- |
| [0001](0001-build-against-lexicon-1-0.md)     | Build against lexicon 1.0, and the 18 corrections to SPEC §3       | accepted | 0     |
| [0002](0002-lossless-round-trip.md)           | One field map drives both import and export                        | accepted | 0     |
| [0003](0003-pure-core-enforced-boundaries.md) | A pure core, with the boundary enforced by lint                    | accepted | 0     |
| [0004](0004-edition-qualified-ruling-ids.md)  | Ruling ids are edition-qualified                                   | accepted | 0     |
| [0005](0005-stack-and-tooling.md)             | Stack, pinned versions and the test gate                           | accepted | 0     |
| [0006](0006-stable-ids-and-untrusted-text.md) | Stable ids are the only reference, and generated text is untrusted | accepted | 0     |
| [0007](0007-app-owns-the-json.md)             | The app owns the canonical JSON                                    | accepted | 1     |
| [0008](0008-editions-and-id-placement.md)     | 1.0 is frozen; ids go to a sidecar until 1.1                       | accepted | 1     |
| [0009](0009-vocabulary-only-supplements.md)   | How a vocabulary-only supplement is integrated                     | accepted | 1.1   |
| [0010](0010-reconstructed-python-modules.md)  | `liraasa_core.py` and `liraasa_lexicon.py`, reconstructed          | accepted | 1.1   |

ADR-0007 and ADR-0008 record decisions the author made in answer to the Phase 0
report; the questions and answers are summarised in each. ADR-0009 and ADR-0010
come out of the 1.0 → 1.1 vocabulary integration. ADR-0009 and ADR-0010
come out of the 1.0 → 1.1 vocabulary integration.

Expected in later phases: the parser's ranking rules (Phase 2), the scheduler
choice between FSRS and SM-2 (Phase 7), and Tauri packaging (Phase 8, per
SPEC §13).
