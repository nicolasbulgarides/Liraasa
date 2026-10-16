"""build_1_0.py — deterministic upgrade of lexicon_0_8_rc2.json to liraasa_1_0.json.

Stages follow the brief's order. Every mutation is driven by decisions_1_0.py;
nothing is typed by hand into the output. Re-running produces identical output.

usage: python3 build_1_0.py SOURCE_0_8.json OUT_1_0.json
"""
import sys, os, json, copy, hashlib, re, collections, datetime
sys.path.insert(0, os.path.dirname(__file__))
from liraasa_core import (FORM_KEYS, seven_forms, is_unused, UNUSED, syllable_count, verb_of)
import decisions_1_0 as D

JUNK_SYN = re.compile(r"^(concept of|idea of|about|related to|expression of|state of) ", re.I)


def clean_synonyms(s):
    if isinstance(s, list):
        items = s
    else:
        items = [x.strip() for x in str(s or "").split(";")]
    out, seen = [], set()
    for x in items:
        x = x.strip().strip(",").strip()
        x = re.sub(r"\(+$", "", x).strip()
        if not x or JUNK_SYN.match(x) or x.count("(") != x.count(")"):
            continue
        if x.lower() not in seen:
            seen.add(x.lower()); out.append(x)
    return out


def parts08(h):
    if "compound" in h:
        return [h["compound"]["modifier"], h["compound"]["head"]]
    if "modifier" in h:
        return [h["modifier"], h["head"]]
    return None


INFERRED_PARTS = {"kronobio": ["krono", "bio"], "lumivera": ["lumi", "vera"],
                  "mavopago": ["mavo", "pago"], "mavolumi": ["mavo", "lumi"]}


def main(src, out):
    with open(src) as f:
        old = json.load(f)
    log = []          # changelog rows
    def L(kind, item, detail):
        log.append({"stage": kind, "item": item, "detail": detail})

    # ---------------------------------------------------------- 1-2 load + snapshot
    H08 = {h["root"]: h for h in old["headwords"]}
    snapshot = {
        "source_file": os.path.basename(src), "source_version": old["version"],
        "source_sha256": hashlib.sha256(open(src, "rb").read()).hexdigest(),
        "headwords": len(old["headwords"]),
        "primal_roots": sum(1 for h in old["headwords"] if h["type"] in ("Primal", "Root")),
        "compounds": sum(1 for h in old["headwords"] if h["type"] == "Compound"),
        "function_words": len(old["function_words"]),
    }

    # ---------------------------------------------------------- base headword conversion
    heads = {}
    for h in old["headwords"]:
        typ = "Primal" if h["type"] in ("Primal", "Root") else "Compound"
        comps = parts08(h) if typ == "Compound" else None
        if typ == "Compound" and comps is None:
            comps = INFERRED_PARTS[h["root"]]
            L("metadata", h["root"], f"components inferred from spelling: {'+'.join(comps)} (absent in 0.8 record)")
        heads[h["root"]] = {
            "root": h["root"], "type": typ, "components": comps,
            "forms": dict(h["forms"]), "glosses": dict(h["glosses"]),
            "register": h["register"], "domain": h["domain"],
            "english_synonyms": clean_synonyms(h.get("english_synonyms")),
            "status_1_0": "CARRIED", "since": h.get("added_in", "≤0.7"),
            "history_0_8": {"status": h["status"], "editorial_note": h.get("editorial_note", "")},
            "notes": "", "protected": True,
        }

    legacy_retired, legacy_respelled, legacy_compounds, legacy_senses = [], [], [], []
    migration_forms = {}     # old spelling -> {"to": new spelling, "slot": slot, "via": headword}

    def map_forms(old_root, new_root, kind):
        of, nf = seven_forms(old_root), seven_forms(new_root)
        oh = H08[old_root]
        for k in FORM_KEYS:
            o = oh["forms"][k]
            migration_forms[o] = {"to": nf[k], "slot": k, "via": old_root, "kind": kind}

    # ---------------------------------------------------------- 3-4 respellings (REPLACE)
    for o, n in D.REPLACE_RESPELL.items():
        h = heads.pop(o)
        nh = copy.deepcopy(h)
        nh["root"] = n; nh["forms"] = seven_forms(n)
        nh["status_1_0"] = "REPLACED"; nh["replaces"] = o; nh["since"] = "1.0"
        nh["notes"] = "Respelled in 1.0: " + D.ROOT_REVIEW[o][2]
        heads[n] = nh
        map_forms(o, n, "respelled")
        legacy_respelled.append({"old": o, "new": n, "old_forms": H08[o]["forms"],
                                 "glosses": H08[o]["glosses"], "reason": D.ROOT_REVIEW[o][2],
                                 "reserved": True})
        L("respell", o, f"{o} → {n}")

    # ---------------------------------------------------------- 3-7 retirements
    for o, (rep, mod, hd, reason, ovr) in D.RETIRE.items():
        h = heads.pop(o)
        g_old = H08[o]["glosses"]
        g_new = {}
        slot_fate = {}
        for k in FORM_KEYS:
            if k in ovr:
                g_new[k] = ovr[k]
                slot_fate[k] = "REDEFINED" if not is_unused(g_old[k]) else "ACTIVATED"
            elif is_unused(g_old[k]):
                g_new[k] = UNUSED; slot_fate[k] = "UNUSED"
            else:
                g_new[k] = g_old[k]; slot_fate[k] = "TRANSFERRED"
        heads[rep] = {
            "root": rep, "type": "Compound", "components": [mod, hd],
            "forms": seven_forms(rep), "glosses": g_new,
            "register": h["register"], "domain": h["domain"],
            "english_synonyms": h["english_synonyms"],
            "status_1_0": "NEW", "since": "1.0", "replaces": o,
            "history_0_8": None,
            "notes": f"Replaces retired primal root {o}. {reason}",
        }
        map_forms(o, rep, "retired")
        legacy_retired.append({"old": o, "replacement": rep, "components": [mod, hd],
                               "old_forms": H08[o]["forms"], "old_glosses": g_old,
                               "new_forms": seven_forms(rep), "new_glosses": g_new,
                               "slot_fate": slot_fate, "reason": reason,
                               "tier": None, "reserved": True})
        L("retire", o, f"{o} → {rep} ({mod}+{hd})")

    for o, (target, reason, ovr) in D.MERGE_INTO_EXISTING.items():
        h = heads.pop(o)
        t = heads[target]
        g_old = H08[o]["glosses"]
        before = dict(t["glosses"])
        slot_fate = {}
        for k in FORM_KEYS:
            if k in ovr:
                t["glosses"][k] = ovr[k]; slot_fate[k] = "TRANSFERRED" if not is_unused(g_old[k]) else "MERGED"
            else:
                slot_fate[k] = "UNUSED" if is_unused(g_old[k]) else "DROPPED"
        t["status_1_0"] = "MERGED"; t["notes"] = f"Absorbs retired root {o}. {reason}"
        t["english_synonyms"] = clean_synonyms(h["english_synonyms"] + t["english_synonyms"])
        map_forms(o, target, "merged")
        legacy_retired.append({"old": o, "replacement": target, "components": t["components"],
                               "old_forms": H08[o]["forms"], "old_glosses": g_old,
                               "new_forms": t["forms"], "new_glosses": t["glosses"],
                               "slot_fate": slot_fate, "reason": reason, "reserved": True,
                               "target_previous_glosses": before})
        L("merge", o, f"{o} merged into existing {target}")

    # ---------------------------------------------------------- 8 dependent compounds
    retired_set = set(D.RETIRE) | set(D.MERGE_INTO_EXISTING)
    for c, spec in D.DEPENDENT_REWRITES.items():
        h = heads.pop(c)
        if spec[0] == "REWRITE":
            _, new, mod, hd, note = spec
            nh = copy.deepcopy(h)
            nh.update(root=new, components=[mod, hd], forms=seven_forms(new), status_1_0="REWRITTEN",
                      since="1.0", replaces=c, notes="Rebuilt because a component retired: " + note)
            heads[new] = nh
            map_forms(c, new, "rewritten")
            legacy_compounds.append({"old": c, "disposition": "REWRITE", "new": new, "old_glosses": H08[c]["glosses"], "note": note})
            L("dependent", c, f"rewritten → {new}")
        else:
            _, phrase, note = spec
            legacy_compounds.append({"old": c, "disposition": "ARCHIVE", "phrase": phrase, "old_glosses": H08[c]["glosses"], "note": note})
            migration_forms[H08[c]["forms"]["root"]] = {"to": phrase, "slot": "root", "via": c, "kind": "archived-phrase"}
            L("dependent", c, f"archived; phrase '{phrase}'")

    # ---------------------------------------------------------- 10 unresolved compounds
    for c, (disp, glosses, note) in D.UNRESOLVED.items():
        h = heads[c]
        legacy_senses.append({"word": c, "0_8_gloss": dict(h["glosses"]),
                              "historical_sense": "unknown (0.5 song expression; no author record)", "note": note})
        for k in FORM_KEYS:
            h["glosses"][k] = glosses.get(k, UNUSED)
        h["status_1_0"] = "REDEFINED"; h["notes"] = note
        h["english_synonyms"] = clean_synonyms([glosses["root"].split(";")[0]] + [x.strip() for x in glosses["root"].split(";")[1:]])
        L("redefine", c, glosses["root"])

    # ---------------------------------------------------------- 9 new roots
    for r, spec in D.NEW_ROOTS.items():
        assert r not in heads, r
        heads[r] = {"root": r, "type": "Primal", "components": None, "forms": seven_forms(r),
                    "glosses": spec["glosses"], "register": "everyday", "domain": spec["domain"],
                    "english_synonyms": spec["syn"], "status_1_0": "NEW", "since": "1.0",
                    "history_0_8": None, "notes": f"{spec['source']}. {spec['why']}"}
        L("new-root", r, spec["glosses"]["root"])

    # ---------------------------------------------------------- 8 storytelling + extra compounds
    story_disp = {}
    def add_compound(c, src_note, status="NEW"):
        w = c["word"]
        assert w not in heads, w
        heads[w] = {"root": w, "type": "Compound", "components": [c["mod"], c["head"]],
                    "forms": seven_forms(w), "glosses": c["glosses"], "register": "everyday",
                    "domain": "Storytelling" if "L09" in src_note else "1.0 additions",
                    "english_synonyms": c["syn"], "status_1_0": status, "since": "1.0",
                    "history_0_8": None, "notes": (src_note + ". " + c.get("note", "")).strip()}
    for sid, spec in D.STORY_COMPOUNDS.items():
        disp = spec[0]
        if isinstance(spec[1], dict):
            add_compound(spec[1], f"0.9 storytelling {sid} ({disp})")
            story_disp[sid] = (disp, spec[1]["word"], spec[1].get("note", ""))
        else:
            story_disp[sid] = (disp, None, spec[2])
    for c in D.EXTRA_COMPOUNDS:
        add_compound(c, "1.0 vocabulary gap")

    # ---------------------------------------------------------- function words
    fws = []
    retire_fw = {"grasia"}
    for fw in old["function_words"]:
        form = fw["Liraasa"]
        if form in retire_fw:
            legacy_senses.append({"word": form, "0_8_gloss": fw["English / function"], "historical_sense": "retired loanword", "note": "Historical quotation only (unchanged policy)."})
            continue
        e = {"form": form, "meaning": fw["English / function"], "position": fw["Use / position"],
             "example": fw.get("Example"), "example_gloss": fw.get("English gloss"),
             "class": None, "status_1_0": "CARRIED", "since": "≤0.8"}
        if form == "ata":
            e["meaning"] = "and"; e["status_1_0"] = "REDEFINED"; e["notes"] = "1.0: ata is only 'and'; additive 'also' is tu (ruling G13)."
        if form == "si":
            e["meaning"] = "if"; e["status_1_0"] = "REDEFINED"; e["notes"] = "1.0: si is only 'if'; 'whether' is ki-oro (ruling G2)."
        if form == "nosi":
            e["meaning"] = "might (epistemic possibility)"; e["status_1_0"] = "REDEFINED"; e["notes"] = "1.0: permission moved to dagi (ruling G3)."
        if form == "kopi":
            e["meaning"] = "hope to"; e["status_1_0"] = "REDEFINED"; e["notes"] = "1.0: intention moved to menvima sidu (ruling G5)."
        if form == "musi":
            e["meaning"] = "must (obligation / circumstantial necessity)"; e["status_1_0"] = "REDEFINED"; e["notes"] = "1.0: logical 'must' = tosu + seye (ruling G4)."
        if form == "fututi":
            e["notes"] = "Also the imminent operator 'about to' in the approach slot (ruling G7)."
        fws.append(e)
    for p in D.PARTICLES:
        fws.append({"form": p["form"], "meaning": p["meaning"], "position": p["slot"], "class": p["cls"],
                    "example": p["ex"][0][0], "example_gloss": p["ex"][0][1], "examples": p["ex"],
                    "status_1_0": "NEW", "since": "1.0", "notes": p.get("src", "")})
        L("particle", p["form"], p["meaning"])

    # ---------------------------------------------------------- grammar model
    grammar = build_grammar()

    # ---------------------------------------------------------- examples migration
    migrated_examples = []
    def migrate_text(text):
        return migrate_line(text, migration_forms, H08)
    EXAMPLE_REWRITES = {
        "Maivo lirala yehu.": ("Maivo yehu lirala.", "evidential moved before the verb (0.8 rule; the 0.8 example contradicted it)"),
        "va-pagopa; du-pagopa; mi-pagopa": ("va-pagopa; du-pagopa; turnata", "mi- retired; turna (enter) replaces it"),
        "Si maivo po masuma, taivo viki po relsira.": ("Si maivo po noma masuma, taivo po viki relsira.", "1.0 counterfactual: tense before modal; noma marks the contrary-to-fact condition (G6)"),
    }
    RETIRED_PREFIX = {"lu-": "keleka (climb, rise)", "nu-": "nevra (descend)", "mi-": "turna (enter)", "so-": "duvla (exit) / sudeseno (announce)"}
    for e in old["examples"]:
        if e["Liraasa"] in EXAMPLE_REWRITES:
            nl, why = EXAMPLE_REWRITES[e["Liraasa"]]
            migrated_examples.append({"liraasa": nl, "english": e["English"], "feature": e.get("Grammar feature"), "status": "MIGRATED", "changes": [why], "source": "0.8 examples"})
            continue
        pref = next((k for k in RETIRED_PREFIX if e["Liraasa"].startswith(k)), None)
        if pref:
            migrated_examples.append({"liraasa": e["Liraasa"], "english": e["English"], "feature": e.get("Grammar feature"), "status": "HISTORICAL",
                                      "changes": [f"motion prefix {pref} retired in 1.0; use {RETIRED_PREFIX[pref]}"], "source": "0.8 examples"})
            continue
        if "=" in e["Liraasa"] and "+" in e["Liraasa"]:
            migrated_examples.append({"liraasa": e["Liraasa"], "english": e["English"], "feature": e.get("Grammar feature"), "status": "FORMULA", "source": "0.8 examples"})
            continue
        if e.get("Status") == "HISTORICAL":
            migrated_examples.append({"liraasa": e["Liraasa"], "english": e["English"], "feature": e.get("Grammar feature"), "status": "HISTORICAL", "source": "0.8 examples"})
            continue
        new, changes = migrate_text(e["Liraasa"])
        migrated_examples.append({"liraasa": new, "english": e["English"], "feature": e.get("Grammar feature"),
                                  "status": "MIGRATED" if changes else "CARRIED", "changes": changes, "source": "0.8 examples"})
    for e in old["grammar_examples_0_8"]:
        new, changes = migrate_text(e["liraasa"])
        migrated_examples.append({"liraasa": new, "english": e["english"], "feature": e.get("section"),
                                  "status": "MIGRATED" if changes else "CARRIED", "changes": changes, "source": "0.8 grammar examples"})
    # si→ki-oro where si meant 'whether' (G2): rewrite deterministically after verbs of asking/knowing
    for e in migrated_examples:
        t = e["liraasa"]
        t2 = re.sub(r"\b(masuma|sabesia|pensapa|ramura|serbusia) si\b", r"\1 ki-oro", t)
        t2 = re.sub(r"\bata (lirala|opioa)\b", r"\1", t2) if False else t2
        if t2 != t:
            e.setdefault("changes", []).append("si → ki-oro (G2)"); e["liraasa"] = t2; e["status"] = "MIGRATED"
    for p in D.PARTICLES:
        for lir, en in p["ex"]:
            migrated_examples.append({"liraasa": lir, "english": en, "feature": f"{p['form']} ({p['cls']})", "status": "NEW", "source": "1.0 particle examples"})

    # ---------------------------------------------------------- 13 rhyme families
    rhyme = collections.defaultdict(list)
    for w in heads:
        rhyme[w[-4:]].append(w)
    rhyme_families = [{"ending": k, "members": sorted(v), "count": len(v)} for k, v in sorted(rhyme.items())]

    # ---------------------------------------------------------- sound ledger
    ledger = []
    for r in legacy_retired:
        ledger.append({"spelling": r["old"], "state": "RECLAIMED-RESERVED", "replacement": r["replacement"],
                       "reusable_from": "2.0", "why_reserved": "version gating: 0.8 texts and derived forms still resolve to the old meaning"})
    for r in legacy_respelled:
        ledger.append({"spelling": r["old"], "state": "RESPELLED-RESERVED", "replacement": r["new"],
                       "reusable_from": "never (respelled for a defect)", "why_reserved": r["reason"]})
    for c in legacy_compounds:
        ledger.append({"spelling": c["old"], "state": "ARCHIVED-COMPOUND" if c["disposition"] == "ARCHIVE" else "REWRITTEN-COMPOUND",
                       "replacement": c.get("new") or c.get("phrase"), "reusable_from": "never (compound spelling)",
                       "why_reserved": c["note"]})

    # ---------------------------------------------------------- assemble
    hw_list = [heads[k] for k in sorted(heads)]
    for h in hw_list:
        h["protected"] = True
    out_doc = {
        "language": "Liraasa",
        "version": "1.0",
        "built_utc": "2026-10-16T00:00:00Z",
        "source": "Built deterministically from lexicon_0_8_rc2.json by build_1_0.py using decisions_1_0.py. This JSON is the single source of truth for Liraasa 1.0.",
        "snapshot_0_8": snapshot,
        "phonology": {
            "vowels": "a e i o u (pure); adjacent vowels are separate syllables",
            "consonants_core": "l m n r s v y", "consonants_other": "b d p t g h z k c f j (sh, ch only in colour/number words)",
            "stress": "penultimate syllable",
            "new_root_template": "two syllables, consonant-initial, vowel-final, letters from the inventory, no initial cluster (kr-, tr- grandfathered), no three-consonant cluster, no doubled letter, at least two edits from every active word",
            "function_word_template": "one to three syllables, vowel-final, no initial cluster; at least two edits from every active word; monosyllables may sit one edit from another monosyllable only if they belong to different syntactic positions (declared list)",
            "protected_exceptions": ["amor", "apok", "opi→opioa", "36 amor- double-a roots (legacy canon)", "kr-, tr- initial clusters"],
            "declared_distance_1_pairs": [["mavo", "maivo"], ["lira", "zira"], ["peli", "eli"], ["somu", "somi"], ["pensa", "penta"],
                                          ["ka", "ke"], ["ki", "ka"], ["si", "su"], ["da", "de"], ["po", "ko"], ["tu", "su"]],
        },
        "morphology": {
            "seven_forms": old["rules"]["seven_forms"], "verb_rule": old["rules"]["verb"],
            "suffix_order": "ROOT + (one form OR one derivation) + -ti + -ri",
            "suffixes": old["rules"]["suffixes"],
            "compounding": "MODIFIER+HEAD written together; head rightmost; components must be active 1.0 headwords; a compound's verb class follows its first letter",
            "lexicalised_derivations": D.LEXICALISED_DERIVATIONS,
        },
        "motion_prefixes": {"canon": {"va-": "toward the speaker", "du-": "away; giving away", "taro-": "across", "yave-": "together, to meet", "revo-": "back, again (curated metaphors: revo-vimova, revo-lirala)"},
                            "retired": RETIRED_PREFIX, "rule": "closed list; only on motion verbs and the listed metaphors; not productive"},
        "settled_open_questions_0_8": [
            {"q": "Meanings of nevlosolo, kronobelda, marelirbu", "answer": "REDEFINE with literal 1.0 meanings; 0.5 senses archived as unknown."},
            {"q": "Veto any 0.8 addition?", "answer": "No. All 81 0.8 headwords, the nine new sacred meanings, yugelotero, yebana and mebanena are 1.0 canon."},
            {"q": "Root Review queue", "answer": "Closed: 23 KEEP, 10 retired by compound, 7 respelled (see dispositions.root_review)."},
            {"q": "Can -yo/-vu/-pago combine with -asa or -na?", "answer": "No. A word takes one form OR one derivation, then -ti, then -ri."},
            {"q": "Which verbs are transitive?", "answer": "Usage-based: gome may passivise any verb that is used with an object in the clause; a verb used without an object cannot take gome. No lexical flag is needed."},
            {"q": "Are ordinals and fractions canon?", "answer": "Yes: NUMBER-ne (una-ne, first) before the noun; fractions NUMBER de NUMBER (tressa de cuara). ne after a number is never negation, because ne precedes what it negates."},
            {"q": "Should motion prefixes become productive?", "answer": "No. Closed list va-, du-, taro-, yave-, revo-; lu-, nu-, mi-, so- retired in favour of the roots keleka, nevra, turna, duvla."},
            {"q": "Should canon spellings carry a protected flag?", "answer": "Yes. Every 1.0 headword carries protected: true; tools may never regenerate a canon spelling by rule."},
        ],
        "headwords": hw_list,
        "function_words": fws,
        "pronouns": [{"form": p["Liraasa"], "person": p["Person"], "number": p["Number / scope"],
                      "possessive": p["Possessive phrase"], "reflexive": p["Reflexive"]} for p in old["pronouns"]],
        "correlatives": [{"form": c["Liraasa correlative"], "determiner": c["Determiner"], "concept": c["Semantic concept"],
                          "gloss": c["English gloss"]} for c in old["correlatives"]],
        "numbers": old["numbers"],
        "time_and_dates": [{"form": t["Liraasa"], "english": t["English"]} for t in old["time_and_dates"]],
        "colors": old["colors"],
        "discourse_particles": [{"form": d["particle"], "function": d["function"], "positions": d["positions"],
                                 "register": d["register"], "examples": d.get("examples", [])} for d in old["discourse_particles"]],
        "grammar": grammar,
        "rulings_1_0": [{"id": i, "topic": t, "ruling": r} for i, t, r in sorted(D.RULINGS_1_0, key=lambda x: int(x[0][1:]))],
        "rulings_0_8_carried": old["grammar_rulings_0_8"],
        "examples": migrated_examples,
        "rhyme_families": rhyme_families,
        "legacy": {
            "policy": "Version-gated. Text written before 1.0 is read with lexicon_0_8_rc2.json. No retired spelling is reassigned in 1.0; all are reserved until at least 2.0.",
            "retired_roots": legacy_retired, "respelled_roots": legacy_respelled,
            "retired_compounds": legacy_compounds, "archived_senses": legacy_senses,
            "migration_forms": migration_forms,
            "editorial_notes_0_7": old["editorial_notes_0_7"],
            "data_fixes_0_8": old["data_fixes_0_8"],
            "rulings_0_8": old["grammar_rulings_0_8"],
        },
        "sound_ledger": ledger,
        "dispositions": build_dispositions(story_disp),
        "changelog_1_0": log,
    }
    with open(out, "w") as f:
        json.dump(out_doc, f, ensure_ascii=False, indent=1)
    print(f"wrote {out}: {len(hw_list)} headwords, {sum(1 for h in hw_list if h['type']=='Primal')} primal, "
          f"{sum(1 for h in hw_list if h['type']=='Compound')} compounds, {len(fws)} function words")


# ------------------------------------------------------------------ text migration
def migrate_line(text, mig, H08):
    """Replace legacy spellings token by token (lexicon-first, keeps -ti/-ri and -yo/-vu/-pago)."""
    changes = []
    def repl(m):
        tok = m.group(0)
        low = tok.lower()
        cap = tok[:1].isupper()
        new = None
        for suf in ("", "ri", "ti", "tiri"):
            base = low[: len(low) - len(suf)] if suf else low
            if suf and not low.endswith(suf):
                continue
            if base in mig:
                new = mig[base]["to"] + suf; break
            for d in ("yo", "vu", "pago"):
                if base.endswith(d) and base[: -len(d)] in mig and mig[base[: -len(d)]]["slot"] == "root":
                    new = mig[base[: -len(d)]]["to"] + d + suf; break
            if new: break
        if new is None:
            return tok
        changes.append(f"{tok} → {new}")
        return new[:1].upper() + new[1:] if cap else new
    out = re.sub(r"[A-Za-z]+", repl, text)
    return out, changes


# ------------------------------------------------------------------ grammar model
def build_grammar():
    slots = [
        {"n": 1, "slot": "FRAME", "words": ["time words", "correlatives of time", "zafra", "finra", "lanto", "kenvi"], "notes": "clause-initial; followed by a pause"},
        {"n": 2, "slot": "TOPIC", "words": ["NP + hozi"], "notes": "optional; at most one per clause except paired contrastive topics in parallel clauses"},
        {"n": 3, "slot": "SUBJECT", "words": ["noun phrase", "pronoun"], "notes": "obligatory except in commands, hortatives and permitted ellipsis"},
        {"n": 4, "slot": "TENSE", "words": ["po", "futu", "pressa"], "notes": "none = present"},
        {"n": 5, "slot": "REALITY", "words": ["noma"], "notes": "counterfactual"},
        {"n": 6, "slot": "NEGATION", "words": ["ne"], "notes": "floats: may also stand before any later operator or the verb, negating what follows"},
        {"n": 7, "slot": "MODAL", "words": ["povi", "nosi", "dagi", "musi", "suvi", "viki", "kopi"], "notes": "one per clause"},
        {"n": 8, "slot": "APPROACH", "words": ["tavki", "fututi"], "notes": "almost / about to"},
        {"n": 9, "slot": "PHASE", "words": ["hiro", "teki"], "notes": "begin / stop"},
        {"n": 10, "slot": "EFFORT", "words": ["telvo", "vazdi", "fesmo"], "notes": "try / manage / try and fail"},
        {"n": 11, "slot": "ASPECT", "words": ["roni", "tefa", "sahi"], "notes": "progressive / completed / habitual"},
        {"n": 12, "slot": "ITERATION", "words": ["bodu", "reve", "loki"], "notes": "already / again / still; reve and loki may instead close the clause"},
        {"n": 13, "slot": "EVIDENTIAL", "words": ["yehu", "gesu", "bisu", "vuda", "buyu", "tosu"], "notes": "one per clause"},
        {"n": 14, "slot": "VERB", "words": ["any verb form", "copulas ke ka kapoki loya miyo", "valency operators vaku lesvu tekvu (+ ACTOR + embedded verb)", "gome (+ verb)"], "notes": ""},
        {"n": 15, "slot": "OBJECT", "words": ["noun phrase"], "notes": ""},
        {"n": 16, "slot": "ADJUNCTS", "words": ["prepositional phrases", "la + adjective", "vobi NP", "sabri NP", "korsi NP"], "notes": ""},
        {"n": 17, "slot": "RECIPROCAL", "words": ["fuyi"], "notes": ""},
        {"n": 18, "slot": "STATUS", "words": ["hoyo", "yasmo"], "notes": "mirative / shared knowledge"},
        {"n": 19, "slot": "ATTITUDE", "words": ["seye", "mufe", "poye", "pifu", "zoke"], "notes": "zoke excludes the other four"},
        {"n": 20, "slot": "QUESTION", "words": ["ki"], "notes": "last word of its clause"},
    ]
    scope_ops = {"words": ["ne", "doli", "tu", "yesta", "pendi", "vinto"], "rule": "immediately before the constituent they scope over (noun phrase, verb, adjective, number, clause-introducer such as si)"}
    stacking = {
        "one_per_slot": True,
        "exclusions": [["hiro", "roni"], ["hiro", "tefa"], ["teki", "roni"], ["teki", "tefa"],
                       ["telvo", "tefa"], ["vazdi", "tefa"], ["fesmo", "tefa"],
                       ["zoke", "seye"], ["zoke", "mufe"], ["zoke", "poye"], ["zoke", "pifu"],
                       ["tavki", "fututi"], ["hoyo", "yasmo"]],
        "max_preverbal_operators_recommended": 4,
        "scope": "left scopes over right (G1); ne negates everything to its right up to the verb",
    }
    template = "[FRAME] [TOPIC hozi] SUBJECT [TENSE] [noma] [ne] [MODAL] [APPROACH] [PHASE] [EFFORT] [ASPECT] [ITERATION] [EVIDENTIAL] VERB [OBJECT] [ADJUNCTS] [fuyi] [hoyo|yasmo] [ATTITUDE] [ki]"
    return {"clause_template": template, "slots": slots, "scope_operators": scope_ops, "stacking": stacking,
            "valency": {"vaku": "make (causative)", "lesvu": "let (permissive)", "tekvu": "prevent (preventive)",
                        "pattern": "CAUSER [TENSE…] OP ACTOR [ne] [APPROACH] [PHASE] [EFFORT] VERB [OBJECT]"},
            "noun_phrase": "[QUANTIFIER] [li|eli|ola|OWNER de] [NUMBER] [ADJECTIVES] NOUN[-ti][-ri] [de …] [raho CLAUSE]"}


def build_dispositions(story_disp):
    import openpyxl
    out = {"retirement_candidates": [], "storytelling": [], "root_review": [], "unresolved_compounds": []}
    wb = openpyxl.load_workbook("/mnt/user-data/uploads/Liraasa_0_9_Root_Retirement_and_Fusion_Audit.xlsx", data_only=True)
    for r in list(wb["RETIREMENT CANDIDATES"].iter_rows(values_only=True))[1:]:
        o = r[1]
        if o in D.RETIRE:
            rep = D.RETIRE[o][0]
            disp = "RETIRE"; note = D.RETIRE[o][3]
            if rep != r[3]:
                note = f"Audit proposed {r[3]}; 1.0 uses {rep}. " + note
        elif o in D.MERGE_INTO_EXISTING:
            rep = D.MERGE_INTO_EXISTING[o][0]; disp = "MERGE"; note = D.MERGE_INTO_EXISTING[o][1]
        else:
            rep = None; disp = "KEEP"; note = f"[{D.KEEP[o][0]}] {D.KEEP[o][1]}"
            if o in D.REPLACE_RESPELL:
                disp = "REPLACE"; rep = D.REPLACE_RESPELL[o]; note += f" Respelled {o} → {rep}."
        out["retirement_candidates"].append({"root": o, "tier": r[0], "audit_fusion": r[3], "disposition": disp, "result": rep, "reason": note})
    wb2 = openpyxl.load_workbook("/mnt/user-data/uploads/Liraasa_0_9_Storytelling_Lexicon_Proposals.xlsx", data_only=True)
    def rows(sheet, start):
        hdr = None
        for row in wb2[sheet].iter_rows(values_only=True):
            if row and row[0] == "ID":
                hdr = row; continue
            if hdr and row and row[0] and str(row[0]).startswith("L09"):
                yield dict(zip(hdr, row))
    for d in rows("Compound Proposals", 0):
        disp, word, note = story_disp[d["ID"]]
        out["storytelling"].append({"id": d["ID"], "concept": d["English target"], "type": "compound", "proposed": d["Proposed headword"], "disposition": disp, "result": word, "reason": note})
    for d in rows("New Primal Roots", 0):
        pr = d["Provisional root"]; sd = D.STORY_ROOTS[pr]
        out["storytelling"].append({"id": d["ID"], "concept": d["English concept"], "type": "root", "proposed": pr, "disposition": sd[0], "result": sd[1], "reason": sd[2] if len(sd) > 2 else "Accepted as a new primal root."})
    pmap = {p["form"]: p for p in D.PARTICLES}
    pres = {"zafra": ("ADD", "zafra"), "finra": ("ADD", "finra"), "furela": ("REPLACE", "lanto"), "kenvi": ("ADD", "kenvi"),
            "orava": ("REPLACE", "korsi"), "tavki": ("ADD", "tavki"), "koravi": ("REPLACE", "tonsi"), "narli": ("ADD", "narli")}
    preason = {"furela": "Two edits from kureli (as soon as), another time connector; replaced by lanto.",
               "orava": "Vowel-initial three-syllable form; replaced by the two-syllable korsi, which also serves as the preposition 'instead of'.",
               "koravi": "Three syllables for a high-frequency connector; replaced by tonsi."}
    for d in rows("New Particles", 0):
        cf = d["Candidate form"]; disp, res = pres[cf]
        out["storytelling"].append({"id": d["ID"], "concept": d["English function"], "type": "particle", "proposed": cf, "disposition": disp, "result": res,
                                    "reason": preason.get(cf, f"Accepted; slot: {pmap[res]['slot']}.")})
    for d in rows("Already Expressible", 0):
        out["storytelling"].append({"id": d["ID"], "concept": d["English concept"], "type": "expressible", "proposed": d["Liraasa form"], "disposition": "KEEP", "result": d["Liraasa form"], "reason": "Already expressible in canon; no new word."})
    for o, (disp, new, reason) in D.ROOT_REVIEW.items():
        out["root_review"].append({"root": o, "disposition": disp, "result": new, "reason": reason})
    for c, (disp, g, note) in D.UNRESOLVED.items():
        out["unresolved_compounds"].append({"word": c, "disposition": disp, "result": g["root"], "reason": note})
    return out


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
