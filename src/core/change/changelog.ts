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
  | 'split_entry';

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
