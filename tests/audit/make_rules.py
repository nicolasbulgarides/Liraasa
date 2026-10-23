"""Build tests/audit/rules.json, the rule inventory of the grammar audit, from
the live lexicon: the grammar section, morphology and phonology first (R01-R25,
hand-stated below), then every ruling of every edition, oldest first. Rerun
after an edition changes:  PYTHONUTF8=1 python tests/audit/make_rules.py
"""
import json, re, subprocess, sys

LEX = sys.argv[1] if len(sys.argv) > 1 else "data/lexicon/liraasa_2_3.json"
L = json.load(open(LEX, encoding="utf8"))

SECTION = [
    ("grammar.clause_template", "grammar", "Clause order: [FRAME] [TOPIC hozi] SUBJECT [TENSE] [noma] [ne] [MODAL] [APPROACH] [PHASE] [EFFORT] [ASPECT] [ITERATION] [EVIDENTIAL] VERB [OBJECT] [ADJUNCTS] [fuyi] [hoyo|yasmo] [ATTITUDE] [ki]."),
    ("grammar.slots[3]", "grammar", "The subject is obligatory except in commands, hortatives and permitted ellipsis."),
    ("grammar.slots[4]", "grammar", "Tense is po (past), futu (future) or pressa (present); no tense word = present."),
    ("grammar.stacking.one_per_slot", "grammar", "At most one word per operator slot (one modal, one evidential, one tense…)."),
    ("grammar.stacking.exclusions", "grammar", "Excluded pairs: hiro/teki with roni/tefa; telvo/vazdi/fesmo with tefa; zoke with seye/mufe/poye/pifu; tavki with fututi; hoyo with yasmo."),
    ("grammar.stacking.max_preverbal_operators_recommended", "grammar", "No more than four preverbal operators are recommended."),
    ("grammar.slots[6]", "grammar", "ne floats: it may stand before any later operator or the verb, negating what follows."),
    ("grammar.slots[12]", "grammar", "reve and loki may close the clause instead of standing in the iteration slot."),
    ("grammar.slots[1]", "grammar", "FRAME words are clause-initial and followed by a pause (comma)."),
    ("grammar.slots[2]", "grammar", "At most one hozi topic per clause, except paired contrastive topics in parallel clauses."),
    ("grammar.slots[20]", "grammar", "ki is the last word of its clause."),
    ("grammar.slots[19]", "grammar", "Attitude words close the clause, before ki; zoke excludes the other four."),
    ("grammar.scope_operators", "grammar", "ne, doli, tu, yesta, pendi, vinto stand immediately before the constituent they scope over."),
    ("grammar.valency", "grammar", "CAUSER [TENSE…] vaku|lesvu|tekvu ACTOR [ne] [APPROACH] [PHASE] [EFFORT] VERB [OBJECT]."),
    ("grammar.noun_phrase", "grammar", "Noun phrase: [QUANTIFIER] [li|eli|ola|OWNER de] [NUMBER] [ADJECTIVES] NOUN[-ti][-ri] [de …] [raho CLAUSE]."),
    ("morphology.seven_forms", "morphology", "Every headword has seven forms: R, R+asa, R+na, VERB, R+nasan, R+san, R+asasan."),
    ("morphology.verb_rule", "morphology", "Verb: opi→opioa; n-initial R+nia; s-initial R+sia; vowel-initial R+a; otherwise R + first consonant + a."),
    ("morphology.suffix_order", "morphology", "ROOT + (one form OR one derivation) + -ti + -ri; -ri is always last."),
    ("morphology.compounding", "morphology", "MODIFIER+HEAD written together, head rightmost; a compound's verb class follows its first letter."),
    ("morphology.derivation_defaults", "morphology", "Default readings: -yo one who does/is devoted to R; -vu big or intense R; -pago place of R; -ti little or dear R; a listed derivation overrides."),
    ("morphology.suffixes.-pago", "morphology", "mavo + -pago is blocked: mavopago means society only."),
    ("motion_prefixes", "morphology", "Motion prefixes va- du- taro- yave- revo- are a closed, non-productive list, on motion verbs and the curated metaphors only."),
    ("phonology.stress", "phonology", "Stress falls on the penultimate syllable; adjacent vowels are separate syllables."),
    ("phonology.new_root_template", "phonology", "New roots: two syllables, consonant-initial, vowel-final, inventory letters, no initial cluster but kr- tr-, no three-consonant cluster, no doubled letter, two edits from every active word."),
    ("phonology.function_word_template", "phonology", "Function words: one to three syllables, vowel-final, no initial cluster, two edits from every active word except declared monosyllable pairs."),
]

KIND = {  # rulings that are not clause grammar
    "0.8:R1": "process", "0.8:R2": "lexicon", "0.8:R3": "process", "0.8:R7": "reading", "0.8:R8": "morphology",
    "0.8:R10": "register", "0.8:R11": "process", "0.8:R12": "morphology", "1.0:G19": "reading", "1.0:G20": "lexicon",
    "2.0:G37": "phonology", "2.0:G38": "morphology", "2.0:G39": "lexicon", "2.0:G40": "morphology", "2.0:G41": "morphology",
    "2.0:G42": "morphology", "2.0:G43": "phonology", "2.0:G44": "phonology", "2.0:G45": "lexicon", "2.1:G57": "phonology",
    "2.1:G58": "lexicon", "2.1:G59": "lexicon", "2.2:G68": "process", "2.3:G69": "lexicon", "2.3:G70": "lexicon", "2.3:G71": "lexicon",
}

# Phase 1 flags: contradictions and underspecification, by source
FLAGS = json.load(open("tests/audit/flags.json", encoding="utf8"))

def first_sentence(text):
    text = re.sub(r"\s+", " ", text).strip()
    m = re.match(r"(.+?[.;:])(\s|$)", text)
    s = m.group(1) if m and len(m.group(1)) > 40 else text
    return s if len(s) <= 220 else s[:217] + "…"

rules = []
for src, kind, stmt in SECTION:
    rules.append({"source": src, "title": src.split(".")[-1], "kind": kind, "statement": stmt, "status": "live"})
order = ["rulings_0_8_carried", "rulings_1_0", "rulings_1_2", "rulings_2_0", "rulings_2_1", "rulings_2_2", "rulings_2_3"]
for key in order:
    ed = "0.8" if key.endswith("carried") else key[len("rulings_"):].replace("_", ".")
    for r in L.get(key, []):
        ref = f"{ed}:{r['id']}"
        status = "superseded by " + r["superseded_by"] if "superseded_by" in r else (
            "in part superseded by " + ", ".join(p["by"] for p in r["superseded_in_part"]) if "superseded_in_part" in r else "live")
        rules.append({"source": ref, "title": r["topic"], "kind": KIND.get(ref, "grammar"),
                      "statement": first_sentence(r["ruling"]), "status": status})
for i, r in enumerate(rules, 1):
    r["id"] = f"R{i:02d}" if i < 100 else f"R{i}"
    r["flags"] = FLAGS.get(r["source"], [])
out = [{k: r[k] for k in ("id", "source", "title", "kind", "status", "statement", "flags")} for r in rules]
with open("tests/audit/rules.json", "w", encoding="utf8", newline="\n") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
# the repo's formatter owns the layout of tests/: keep `npm run check` clean
subprocess.run("npx prettier --write tests/audit/rules.json", shell=True, check=True, capture_output=True)
print(len(out), "rules;", sum(1 for r in out if r["kind"] == "grammar"), "grammar")
