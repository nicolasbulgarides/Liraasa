/**
 * The curriculum validator: what the author should look at before lessons can
 * be trusted. Everything the adapter met on the way, plus:
 *
 *   override-unknown-id      a pin, level, note or lesson naming no item,
 *                            concept, ruling or node in this edition       error
 *   form-note-unknown        a form note on no headword, or on a slot that
 *                            is not one of the seven forms                 error
 *   lesson-unknown-ref       `[[id]]` in a custom lesson body with no target error
 *   node-unplaced            a node whose prerequisites can never be met     error
 *   concept-no-examples      a concept no sentence exercises: no exercises   warn
 *   root-no-examples         a headword no sentence uses: card only          note
 */
import { FORM_SLOTS } from '../config/slots';
import type { Gap, LearnData, Overrides, SkillGraph } from './types';

/** `[[lx_amor_0001]]` in a lesson body: a reference by id. */
const REF = /\[\[([^\]]+)\]\]/g;

export function validateCurriculum(
  data: LearnData,
  graph: SkillGraph,
  overrides: Overrides,
): Gap[] {
  const gaps: Gap[] = [...data.gaps];
  const rulingRefs = new Set(
    [...data.concepts.values()].flatMap((c) => (c.ruleRef !== undefined ? [c.ruleRef] : [])),
  );
  const known = (id: string): boolean =>
    data.items.has(id) || data.concepts.has(id) || rulingRefs.has(id) || graph.nodes.has(id);
  const unknown = (ref: string, where: string): void => {
    gaps.push({
      severity: 'error',
      code: 'override-unknown-id',
      ref,
      message: `${where} names ${ref}, which is not an item, concept, ruling or node in ${data.edition}. Was it retired or cut? Its progress and notes need a new home.`,
    });
  };

  for (const id of overrides.pins) if (!known(id)) unknown(id, 'pins');
  for (const id of overrides.exclude) if (!data.concepts.has(id)) unknown(id, 'exclude');
  for (const id of Object.keys(overrides.levels)) if (!known(id)) unknown(id, 'levels');
  for (const id of Object.keys(overrides.notes)) if (!known(id)) unknown(id, 'notes');
  for (const lesson of overrides.lessons) {
    for (const id of lesson.refs) if (!known(id)) unknown(id, `lesson ${lesson.id}`);
    if (lesson.after !== undefined && !graph.nodes.has(lesson.after)) {
      unknown(lesson.after, `lesson ${lesson.id} (after)`);
    }
    for (const m of lesson.body.matchAll(REF)) {
      const id = (m[1] ?? '').trim();
      if (!known(id)) {
        gaps.push({
          severity: 'error',
          code: 'lesson-unknown-ref',
          ref: lesson.id,
          message: `Lesson ${lesson.id} refers to [[${id}]], which does not exist in ${data.edition}.`,
        });
      }
    }
  }

  const slots = new Set<string>(FORM_SLOTS);
  for (const key of Object.keys(overrides.formNotes ?? {})) {
    const [id = '', slot = ''] = key.split('|');
    const item = data.items.get(id);
    if (item !== undefined && item.forms.length > 0 && slots.has(slot)) continue;
    gaps.push({
      severity: 'error',
      code: 'form-note-unknown',
      ref: key,
      message: `formNotes names ${key}, but ${item === undefined ? `${id} is no entry` : item.forms.length === 0 ? `${id} has no forms` : `${slot} is not a form`} in ${data.edition}.`,
    });
  }

  for (const node of graph.nodes.values()) {
    if (node.unit >= 0) continue;
    gaps.push({
      severity: 'error',
      code: 'node-unplaced',
      ref: node.id,
      message: `${node.id} can never unlock: its prerequisites ${node.prereqs.join(', ')} are not all placeable.`,
    });
  }

  const exercised = new Set(data.examples.flatMap((e) => e.concepts));
  const excluded = new Set(overrides.exclude);
  for (const c of data.concepts.values()) {
    if (exercised.has(c.id) || excluded.has(c.id)) continue;
    gaps.push({
      severity: 'warn',
      code: 'concept-no-examples',
      ref: c.id,
      message: `${c.title}: no example or corpus sentence exercises it, so no exercise can be drawn. Add examples to the data (a ruling's own examples are linked to it directly).`,
    });
  }

  const used = new Set(data.examples.flatMap((e) => e.ids));
  for (const item of data.items.values()) {
    if ((item.kind !== 'root' && item.kind !== 'compound') || used.has(item.id)) continue;
    gaps.push({
      severity: 'note',
      code: 'root-no-examples',
      ref: item.id,
      message: `${item.spelling} (“${item.meaning}”) is in no example or text: it gets a card and form drills, but no sentence exercises.`,
    });
  }
  return gaps;
}
