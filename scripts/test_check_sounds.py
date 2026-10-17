"""Unit tests for scripts/check_sounds.py, run against the real 1.1 lexicon.

    python -m unittest scripts/test_check_sounds.py

Every spelling below is a canon word, a reserved spelling, or (for the -ri
case) the stem of a canon word, used only to show that it is rejected.
"""
import copy
import json
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(__file__))
import check_sounds as cs  # noqa: E402

LEXICON = os.path.join(os.path.dirname(__file__), "..", "data", "lexicon", "liraasa_1_1.json")

with open(LEXICON, encoding="utf-8") as f:
    RAW = json.load(f)
LX = cs.Lexicon.build(RAW)


def check(*cands, lx=LX):
    objs = [cs.Candidate.from_json(c) for c in cands]
    return cs.check_candidates(lx, objs), objs


def errors(findings, check_no=None):
    return [f for f in findings if f.severity == "ERROR" and (check_no is None or f.check == check_no)]


class Generation(unittest.TestCase):
    def test_verb_rule(self):
        self.assertEqual(cs.verb_of("opi"), "opioa")
        self.assertEqual(cs.verb_of("nullo"), "nullonia")
        self.assertEqual(cs.verb_of("sabe"), "sabesia")
        self.assertEqual(cs.verb_of("amor"), "amora")
        self.assertEqual(cs.verb_of("lumi"), "lumila")
        self.assertEqual(cs.verb_of("krono"), "kronoka")

    def test_seven_forms_match_every_stored_form(self):
        for h in RAW["headwords"]:
            self.assertEqual(cs.seven_forms(h["root"]), h["forms"], h["root"])

    def test_syllables_count_hiatus(self):
        self.assertEqual(cs.syllabify("dorvaasa"), ["dor", "va", "a", "sa"])
        self.assertEqual(cs.stressed("lumi"), "LU-mi")

    def test_paradigm_has_forms_derivations_and_suffixes(self):
        p = cs.paradigm(cs.Candidate("song", "lira", "root"))
        for w in ("lira", "liraasa", "lirala", "liraasasan", "lirayo", "liravu", "lirapago", "lirati", "lirari", "liratiri", "lirayori"):
            self.assertIn(w, p)
        self.assertNotIn("mavopago", cs.paradigm(cs.Candidate("", "mavo", "root")))

    def test_near_index_agrees_with_levenshtein(self):
        idx = cs.NearIndex(["maivo", "mavo", "malo", "lira", "zira"])
        self.assertEqual(idx.within_one("mavo"), {"maivo", "malo"})
        self.assertEqual(idx.within_one("lira"), {"zira"})


class Required(unittest.TestCase):
    def test_mavo_maivo_passes_as_declared_pair(self):
        # Take mavo out of the lexicon and propose it afresh: maivo is one
        # edit away, but the pair is declared, so check 3 does not fire.
        raw = copy.deepcopy(RAW)
        raw["headwords"] = [h for h in raw["headwords"] if h["root"] != "mavo"]
        lx = cs.Lexicon.build(raw)
        self.assertIn("maivo", lx.active)
        results, _ = check({"concept": "self", "spelling": "mavo", "kind": "root"}, lx=lx)
        self.assertFalse([f for f in results["mavo"] if f.check == 3 and "maivo" in f.message])
        # and the audit of the real lexicon does not report the pair either
        self.assertFalse([d for d in cs.audit(LX)["distance"] if {d["word"], d["near"]} == {"mavo", "maivo"}])

    def test_reproposing_an_existing_root_fails(self):
        results, _ = check({"concept": "song", "spelling": "lira", "kind": "root"})
        self.assertTrue(errors(results["lira"], 2))

    def test_a_reserved_spelling_fails(self):
        self.assertIn("bede", LX.reserved)
        self.assertNotIn("bede", LX.active)
        results, _ = check({"concept": "bed", "spelling": "bede", "kind": "root"})
        msgs = [f.message for f in errors(results["bede"], 2)]
        self.assertTrue(any("RESERVED" in m and m.startswith("bede ") for m in msgs), msgs)

    def test_a_candidate_whose_ri_form_collides_fails(self):
        # fulepari is a canon root; its first six letters are not a word.
        self.assertIn("fulepari", LX.active)
        self.assertNotIn("fulepa", LX.active)
        results, _ = check({"concept": "x", "spelling": "fulepa", "kind": "root"})
        msgs = [f.message for f in errors(results["fulepa"], 2)]
        self.assertTrue(any(m.startswith("fulepari [root + -ri]") for m in msgs), msgs)


class Checks(unittest.TestCase):
    def test_template(self):
        self.assertEqual(cs.root_template("lumi"), [])
        self.assertTrue(cs.root_template("krono"))  # kr- is grandfathered, not open
        self.assertEqual(cs.root_template("krono", audit=True), [])
        self.assertTrue(cs.root_template("nullo"))  # doubled letter
        self.assertTrue(cs.root_template("maivo"))  # three syllables
        self.assertTrue(cs.root_template("amor"))  # vowel-initial

    def test_candidates_collide_with_each_other(self):
        # two concepts given one spelling; alternatives for a single concept are exempt
        results, _ = check({"concept": "a", "spelling": "fulepa", "kind": "root"}, {"concept": "b", "spelling": "fulepa", "kind": "root"})
        self.assertTrue(any("is also fulepa" in f.message for f in results["fulepa"]))

    def test_derivation_on_a_compound_is_in_order(self):
        results, objs = check({"concept": "healer", "spelling": "yugemeyiyo", "kind": "derivation"})
        self.assertEqual((objs[0].base, objs[0].suffix), ("yugemeyi", "yo"))
        self.assertFalse(errors(results["yugemeyiyo"]))

    def test_derivation_on_a_form_breaks_suffix_order(self):
        # lirala is the verb form of lira; -yo attaches to the root
        results, _ = check({"concept": "x", "spelling": "liralayo", "kind": "derivation", "base": "lirala", "suffix": "yo"})
        self.assertTrue(any("suffix order" in f.message for f in errors(results["liralayo"], 4)))

    def test_compound_of_two_headwords(self):
        results, objs = check({"concept": "noon", "spelling": "sulbacemnu", "kind": "compound"})
        self.assertEqual(objs[0].components, ["sulba", "cemnu"])
        self.assertFalse(errors(results["sulbacemnu"], 4))

    def test_audit_finds_only_pre_existing_shapes(self):
        a = cs.audit(LX)
        self.assertNotIn("kaldopago", [c["form"] for c in a["collision"]])
        self.assertIn("maivori", [c["form"] for c in a["collision"]])


if __name__ == "__main__":
    unittest.main()
