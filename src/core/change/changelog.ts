/**
 * The structured changelog (Q1, condition 1).
 *
 * The app owns the canonical JSON, so every edit it makes must be traceable:
 * what changed, the old value, the new value, and why. `build_1_0.py` was a
 * one-time migration and is not the ongoing editor, but its decision record is
 * the standard this has to meet.
 *
 * Phase 1 defines the record and the writer. The change *engine* that produces
 * them — impact analysis, atomic apply, undo — is Phase 5.
 */
import type { RulingRef } from '../config/editions';
import type { FormSlot } from '../config/slots';

export type ChangeOp =
  | 'add_root'
  | 'add_compound'
  | 'edit_gloss'
  | 'edit_metadata'
  | 'respell_root'
  | 'retire_root'
  | 'retire_and_replace'
  | 'activate_slot'
  | 'merge_entries'
  | 'split_entry'
  /** A grammar ruling. `entry` is its edition-qualified id, e.g. `1.2:G24`. */
  | 'add_ruling'
  /** An example sentence. `entry` is `example:<index>` in the lexicon's `examples`. */
  | 'edit_example'
  /** A function word. `entry` is its `fw_` id; the payload is in the changeset (ADR-0013). */
  | 'add_function_word'
  /** A correlative. `entry` is its `cr_` id; the payload is in the changeset. */
  | 'add_correlative'
  /** A lexicalised derivation. `entry` is `derivation:<base id>:-<suffix>`. */
  | 'add_derivation'
  /** A curated motion metaphor. `entry` is `motion:<prefix>-:<verb's headword id>`. */
  | 'add_motion_metaphor'
  /**
   * A lexicalised derivation's gloss. `entry` is the derivation's, as for
   * `add_derivation`; `from` and `to` are its whole text (ADR-0016).
   */
  | 'edit_derivation'
  /** A discourse particle's example. `entry` is `particle:<dp id>:<index>`. */
  | 'edit_particle_example'
  /**
   * A headword becomes an attested instance of the image-compound pattern:
   * it leaves `headwords` and is kept, whole and with its id, in
   * `image_compounds.attested` (2.0, ADR-0016).
   */
  | 'move_to_pattern'
  /**
   * The reverse of `move_to_pattern`: an attested image compound becomes a
   * headword again, whole and with its id, so a later op can give it a
   * lexicalised meaning (3.0, ADR-0021). `from` and `to` are its spelling.
   */
  | 'lexicalise_from_pattern'
  /**
   * The author ratifies a proposed ruling (3.5, ADR-0025): its `status` goes
   * from `proposed` to `ratified`; its text and examples never change.
   * `entry` is its edition-qualified id.
   */
  | 'ratify_ruling'
  /**
   * A new data section, from the changeset's `sections` payload. `entry` is
   * its path: `image_compounds`, `morphology.derivation_defaults`… (ADR-0016).
   */
  | 'add_section'
  /** A sound-ledger row's state. `entry` is `ledger:<spelling>`. */
  | 'edit_ledger'
  /**
   * A primal root becomes a compound of two existing headwords, keeping its
   * id and glosses (2.1:G59). `entry` is its id; `to` is the two parts joined
   * with `+`, e.g. `kezu+pago` (ADR-0017).
   */
  | 'respell_as_compound'
  /**
   * A function word's example. `entry` is its `fw_` id; `field` is `example` or
   * `example_gloss`; `to: null` deletes it (ADR-0017).
   */
  | 'edit_function_word'
  /**
   * A root of `reserved_root_bank` given a meaning: it leaves the bank.
   * `entry` is `bank:<spelling>`; `to` is the id of the headword now spelled so.
   */
  | 'spend_bank_root'
  /**
   * An earlier ruling superseded by one this changeset adds (2.2): it is kept,
   * never renumbered or reworded, and marked `superseded_by`. With `field`, only
   * that clause of it is superseded (`superseded_in_part`). `entry` is the old
   * ruling's edition-qualified id; `to` the new one's (ADR-0018).
   */
  | 'supersede_ruling'
  /**
   * A compound rebuilt on two other headwords, keeping its id and glosses
   * (2.3:G71). `entry` is its id; `to` is the new parts joined with `+`,
   * e.g. `farvi+budi`; every compound built on it follows (ADR-0019).
   */
  | 'recompose_compound'
  /**
   * A compound replaced by a primal root, keeping its id and glosses
   * (2.3:G70). `entry` is its id; `to` is the root's spelling (ADR-0019).
   */
  | 'respell_compound_as_root'
  /**
   * A lexicalised derivation leaves the table, its meaning now carried by a
   * headword (2.3:G70). `entry` is the derivation's, as for `add_derivation`;
   * `from` is its gloss line; `to` is the id of the headword that replaces it.
   * Old texts read the derivation as that headword (ADR-0019).
   */
  | 'retire_derivation'
  /**
   * A text leaves the living lexicon for `legacy.archived_text`, kept whole
   * with the edition and the reason (2.3 review). `entry` is a headword id
   * with `field: "notes"`, or an edition-qualified ruling id with
   * `field: "example:<index>"`. `from` is the text archived; `to` is what the
   * field reads now. The field must read `from`, or already read `to` because
   * a respelling earlier in the build moved it (ADR-0019).
   */
  | 'archive_text'
  /**
   * A stale text in a lexicon section, corrected (the grammar audit, 2.3).
   * `entry` is `text:` + a dotted path (`text:morphology.compounding`,
   * `text:numbers.rules.39.Construction rule`); `from` must be what the field
   * reads. Rulings are never edited this way: they are superseded.
   */
  | 'edit_text'
  /**
   * An earlier ruling amended in part by one this changeset adds (2.5). It is
   * kept as ruled and marked `amended_by: [{by, scope}]`; where they differ the
   * newer ruling is followed. `entry` is the old ruling's id, `from` its topic,
   * `to` the new ruling's id, `field` what is amended.
   */
  | 'amend_ruling'
  /**
   * An earlier ruling whose content a newer one now covers (2.5:G121 covers
   * 2.3:G75). Kept, marked `covered_by`. Same fields as `amend_ruling`.
   */
  | 'mark_ruling_covered'
  /**
   * A non-text value at `value:` + a dotted path (a slot's word list, a new
   * field on a row). `from` and `to` are JSON; `from: null` adds a key that
   * does not exist yet. Rulings are never edited this way (2.5).
   */
  | 'edit_value';

/**
 * One recorded change.
 *
 * The six fields `slot`, `from`, `to`, `ruling`, `addedIn` and `reason` keep
 * the shape ruling 0.8:R2 names, so an activated slot is logged the way the
 * language's own rules require. `entry`, `op`, `at` and `author` are what
 * SPEC §6.5 adds.
 */
export interface ChangeRecord {
  /** The stable id of the entry changed. Never a spelling (ADR-0006). */
  entry: string;
  op: ChangeOp;
  /** Which of the seven slots, where the change is slot-specific. */
  slot?: FormSlot | 'root' | 'metadata';
  /** The previous value. `null` when the entry did not exist. */
  from: string | null;
  /** The new value. `null` when the entry is being retired. */
  to: string | null;
  /** Edition-qualified ruling reference, e.g. `1.0:G19` (ADR-0004). */
  ruling?: RulingRef;
  /** For `edit_metadata`: which field `from` and `to` describe. */
  field?: string;
  /** For `edit_gloss`: keep the old gloss in `legacy.archived_senses`. */
  archive?: boolean;
  /** The edition this change lands in. */
  addedIn: string;
  /** Why. Required: a change with no reason is not traceable. */
  reason: string;
  /** ISO 8601 UTC. */
  at: string;
  author: string;
}

export interface Changeset {
  id: string;
  edition: string;
  created: string;
  author: string;
  summary: string;
  ops: readonly ChangeRecord[];
}

export class ChangelogError extends Error {}

/** Reject a record that would not be traceable. */
export function validateChangeRecord(record: ChangeRecord): void {
  if (record.entry.length === 0) throw new ChangelogError('a change must name an entry id');
  if (record.reason.trim().length === 0) {
    throw new ChangelogError(`${record.entry}: a change must state a reason`);
  }
  if (record.from === null && record.to === null) {
    throw new ChangelogError(`${record.entry}: a change must have a from or a to`);
  }
  if (record.op === 'activate_slot' && record.ruling === undefined) {
    throw new ChangelogError(
      `${record.entry}: activating an unused slot needs a ruling reference (0.8:R2)`,
    );
  }
}

export function validateChangeset(changeset: Changeset): void {
  if (changeset.ops.length === 0) {
    throw new ChangelogError(`${changeset.id}: a changeset must contain at least one operation`);
  }
  for (const op of changeset.ops) validateChangeRecord(op);
}

/**
 * Render a changeset as the `{stage, item, detail}` rows the author's own
 * `changelog_1_0` uses, so the app's history reads like the migration's.
 */
export function toAuthorChangelogRows(
  changeset: Changeset,
  spellingOf: (entryId: string) => string,
): { stage: string; item: string; detail: string }[] {
  return changeset.ops.map((op) => ({
    stage: op.op.replace(/_/g, '-'),
    item: spellingOf(op.entry),
    detail:
      `${op.slot ?? 'entry'}: ${op.from ?? '(none)'} → ${op.to ?? '(retired)'}` +
      ` — ${op.reason}` +
      (op.ruling === undefined ? '' : ` [${op.ruling}]`),
  }));
}
