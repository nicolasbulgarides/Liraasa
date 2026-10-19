"""Render review/audit-report.md from the audit's inputs and results.

    npx tsx tests/audit/run.ts && npx tsx tests/audit/lexicon.ts && \
    npx tsx tests/audit/album.ts && npx tsx tests/audit/myth.ts && \
    PYTHONUTF8=1 python tests/audit/report.py

Inputs: tests/audit/rules.json (Phase 1), issues.json (the classified
findings), and review/audit-results.json, audit-lexicon.json, audit-myth.json,
audit-album.json (Phases 2-6).
"""
import collections, json, re, subprocess

J = lambda p: json.load(open(p, encoding="utf8"))
rules = J("tests/audit/rules.json")
issues = J("tests/audit/issues.json")
res = J("review/audit-results.json")
lexa = J("review/audit-lexicon.json")
myth = J("review/audit-myth.json")
album = J("review/audit-album.json")
rid = {r["source"]: r["id"] for r in rules}
md = lambda s: str(s).replace("|", "\\|").replace("\n", " ")

# Phase 2: where each rule is implemented, from the rule ids the editor's code cites
cites = collections.defaultdict(set)
# every quoted ruling id in the checker's code: rule: '…' and helpers such as addKi('2.2:G60', …)
grep = subprocess.run(["git", "grep", "-n", "-E", r"'([0-9]\.[0-9]:[GR][0-9]+)'", "--", "editor/checker/*.js", "editor/checker/rules"], capture_output=True, text=True, encoding="utf8").stdout
for line in grep.splitlines():
    m = re.match(r"([^:]+):(\d+):(.*)", line)
    if m and "/data/" not in m.group(1):
        for ref in re.findall(r"'([0-9]\.[0-9]:[GR][0-9]+)'", m.group(3)):
            cites[ref].add(f"{m.group(1)}:{m.group(2)}")
SECTION_WHERE = {
    "grammar.clause_template": "checker: slots.js placeClause; rules/order.js (1.0:G1). composer: index.html clauseLine (PRE_ORDER)",
    "grammar.slots[3]": "checker: slots.js (command after fisa); composer: none for yava",
    "grammar.slots[4]": "checker: rules/order.js (1.0:G16 one per slot); composer: MARKERS (po/futu)",
    "grammar.stacking.one_per_slot": "rules/order.js:58",
    "grammar.stacking.exclusions": "rules/order.js:94",
    "grammar.stacking.max_preverbal_operators_recommended": "rules/order.js:107 (note)",
    "grammar.slots[6]": "slots.js:166 (ne recorded without a slot); rules/negation.js",
    "grammar.slots[12]": "slots.js (operators)",
    "grammar.slots[1]": "rules/order.js:155-165",
    "grammar.slots[2]": "slots.js:251 (topic); no count check",
    "grammar.slots[20]": "rules/order.js:134 (1.0:G22)",
    "grammar.slots[19]": "rules/order.js:113-134",
    "grammar.scope_operators": "slots.js:171 (skipped, never checked)",
    "grammar.valency": "slots.js (actor); rules/semantic.js:136",
    "grammar.noun_phrase": "slots.js noun phrases; rules/nounphrase.js; misplaced words reported by rules/verbslot.js",
    "morphology.seven_forms": "checker/lexicon.js forms index; src/core/morphology/sevenForms.ts",
    "morphology.verb_rule": "src/core/morphology/sevenForms.ts verbOf; checker reads only listed forms",
    "morphology.suffix_order": "checker/reader.js readStripped (-ti, -ri)",
    "morphology.compounding": "validator check 7; checker reads listed compounds only",
    "morphology.derivation_defaults": "checker/reader.js readDerivation",
    "morphology.suffixes.-pago": "index.html buildIndex (mavo+pago skipped)",
    "motion_prefixes": "rules/words.js:125 (1.2:G35)",
    "phonology.stress": "src/core/phonetics/g2p.ts (MFA export, Learn); not an editor check",
    "phonology.new_root_template": "src/core/change/respell.ts rootTemplateProblems; scripts/check_sounds.py",
    "phonology.function_word_template": "scripts/check_sounds.py",
}
NON_EDITOR = {"process": "a project rule: not checked in text", "phonology": "scripts/check_sounds.py, the validators, g2p", "lexicon": "the build and the validators (data, not text)", "reading": "checker rules/words.js (1.0:G19)", "register": "checker rules/register.js (note)"}
OVERRIDE = {
    "1.2:G30": ("PARTIAL", "rules/order.js:333 catches su only right after a saying verb (K05)"),
    "0.8:G2": ("PARTIAL", "ne with nothing after it, and ne directly before nuna-, are caught; ne … nuna- across the verb is not (K04)"),
    "1.2:G33": ("PARTIAL", "fires for substance and abstract nouns only (K06)"),
    "1.0:G21": ("PARTIAL", "a note, where the ruling says the clause is closed by a comma (K10)"),
    "1.0:G16": ("PARTIAL", "one word per slot and the excluded pairs are caught (as R04, R05); noma with no tense, modal or si is not (K07)"),
    "0.8:R8": ("DIVERGENT", "the ruling's example words are unused slots since 2.0; the checker calls them not words (S03, K11)"),
}
status = {s["source"]: s for s in res["status"]}
# rulings that restate a section of the template are tested through it
ALIAS = {"0.8:G7": "grammar.noun_phrase", "1.0:G16": "grammar.stacking.one_per_slot", "1.0:G1": "grammar.clause_template"}
for k, v in ALIAS.items():
    if k not in status and v in status:
        status[k] = dict(status[v], checker=status[v]["checker"] + f" (as {rid[v]})")

def checker_status(r):
    if r["source"] in OVERRIDE:
        return OVERRIDE[r["source"]][0]
    s = status.get(r["source"])
    if s:
        return s["checker"]
    if r["kind"] != "grammar":
        return "N/A"
    if r["status"].startswith("superseded"):
        return "SUPERSEDED"
    return "UNTESTED"

out = []
w = out.append
cls_order = ["CODE BUG", "SPEC BUG", "SPEC GAP", "LEXICON ISSUE"]
sev_order = ["high", "medium", "low"]
I = issues["issues"]

w("# Liraasa grammar audit: the editor against the 2.3 spec\n")
w("The audit was run first with nothing changed; the fixes and rulings approved on 2026-10-19 followed, "
  "and every figure below is a rerun on the fixed editor. Each issue carries its status. "
  "The spec is `data/lexicon/liraasa_2_3.json` (its `grammar`, `morphology`, `phonology` sections and every ruling of every edition, "
  "verbatim in `handoff/Liraasa_2_3_Rulings.md`) and the 2.3 Reference Grammar. "
  "\"The editor\" is the songbook editor in `editor/`: its grammar checker (`editor/checker/`), its Compose tab "
  "(English → Liraasa, `editor/index.html`) and its back-translation (Liraasa → English).\n")
w("Rerun everything after a patch:\n")
w("```sh\nnpx tsx tests/audit/run.ts        # Phase 4 rule tests (checker + composer; needs Edge or Chrome)\n"
  "npx tsx tests/audit/lexicon.ts    # Phase 3 lexicon integrity\nnpx tsx tests/audit/album.ts      # Phase 6 album regression\n"
  "npx tsx tests/audit/myth.ts       # Phase 5 myth\nPYTHONUTF8=1 python tests/audit/make_rules.py   # Phase 1 inventory (after an edition)\n"
  "PYTHONUTF8=1 python tests/audit/report.py      # this report\n```\n")

# summary
w("## Summary\n")
w("| | high | medium | low | total |\n| --- | --- | --- | --- | --- |")
for c in cls_order:
    n = collections.Counter(i["sev"] for i in I if i["cls"] == c)
    w(f"| {c} | {n['high']} | {n['medium']} | {n['low']} | {sum(n.values())} |")
w("")
sm = res["summary"]
st = collections.Counter(checker_status(r).split(" (")[0] for r in rules)
w(f"- **Phase 1.** {len(rules)} rules: {sum(1 for r in rules if r['kind']=='grammar')} of clause grammar, the rest morphology, phonology, lexicon and project rules; "
  f"{sum(1 for r in rules if r['flags'])} carry a contradiction or underspecification flag.")
w("- **Phase 2, checker.** " + ", ".join(f"{k} {v}" for k, v in st.most_common()) + ". "
  "IMPLEMENTED: violations are caught under the rule. ACCEPTS: the spec's sentences pass, but no violation was tested or none is checkable without meaning. "
  "UNTESTED: a grammar rule with no case (paragraph-level, or reading older texts).")
w(f"- **Phase 2, composer.** {sm['composeMatch']} of {sm['composed']} English sentences composed exactly as the spec writes them (case and spacing ignored, every spec-allowed variant accepted).")
w(f"- **Phase 3.** {lexa['texts_read']} Liraasa texts read word by word: {len(lexa['unreadable'])} words not readable, all explained (L02, S04, L04). "
  f"No duplicate roots, no compound with a missing part; {len(lexa['duplicate_meanings'])} shared senses, {lexa['near_homophones']['count']} near-homophone root pairs.")
w(f"- **Phase 4.** {sm['cases']} test cases: {sm['goodClean']} of {sm['cases']} spec sentences check clean; {sm['badFlagged']} of {sm['badCases']} rule-breaking sentences are flagged.")
ms = myth["sentences"]
w(f"- **Phase 5.** {len(ms)} myth sentences: the editor composes {sum(1 for s in ms if s['same'])} exactly as the spec does and leaves English gaps in {sum(1 for s in ms if s['editor_gaps'])}; all {sum(1 for s in ms if not s['spec_checked'])} spec translations check clean.")
w(f"- **Phase 6.** {album['lines']} album lines: {album['findings_total']} findings on {album['lines_with_findings']} lines, {album['on_album_readings']} of them on documented album readings.\n")

# decisions
# where the issues stand
def standing(i):
    t = i.get("status", "")
    for key, label in (("FIXED IN PART", "fixed in part"), ("FIXED", "fixed"), ("DECIDED", "decided"),
                       ("RESOLVED", "decided"), ("WITHDRAWN", "withdrawn"), ("NOT CHANGED", "not changed"),
                       ("LEFT OPEN", "left open")):
        if t.startswith(key):
            return label
    return "open"


stand = collections.Counter(standing(i) for i in I)
w("- **Status.** " + ", ".join(f"{v} {k}" for k, v in stand.most_common()) + f" (of {len(I)} issues).\n")
w("## Decisions for you, most blocking first\n")
if not issues["decisions"]:
    w("None left: every decision is in the next section. Still open for the author: C15 (ke or ka before a noun phrase), "
      "L01 (the corpus labels), the two 'birth' senses (L04) and tense inheritance (G04).")
sevw = {i["id"]: 3 - sev_order.index(i["sev"]) for i in I}
ds = sorted(issues["decisions"], key=lambda d: (d.get("bundle", False), -len(d["blocks"]), -sum(sevw.get(b, 0) for b in d["blocks"])))
for n, d in enumerate(ds, 1):
    w(f"{n}. **{d['question']}** ({d['issue']}; settles {len(d['blocks'])} issue{'s' if len(d['blocks']) != 1 else ''}: {', '.join(d['blocks'])})")
if ds:
    w("\nOrdered by how many issues each settles, then by their severity; the bundle of small gaps comes last.")
w("")

# decided
if issues.get("decided"):
    w("## Decided (2026-10-19)\n")
    for d in issues["decided"]:
        w(f"- **{d['question']}** {d['answer']}")
    w("")

# issues
w("## Issues\n")
for c in cls_order:
    group = sorted((i for i in I if i["cls"] == c), key=lambda i: sev_order.index(i["sev"]))
    w(f"### {c} ({len(group)})\n")
    for i in group:
        rs = ", ".join(f"{rid.get(s, '')} {s}".strip() for s in i["rules"])
        w(f"#### {i['id']} · {i['sev']} · {i['title']}\n")
        if i.get("area"):
            w(f"- **Area:** {i['area']}")
        w(f"- **Rules:** {rs}")
        w(f"- **Where:** {i['where']}")
        w(f"- **Evidence:** {i['evidence']}")
        if "fix" in i:
            w(f"- **Proposed fix:** {i['fix']}")
        if "status" in i:
            w(f"- **Status:** {i['status']}")
        if "options" in i:
            w("- **Options (not chosen):** " + " ".join(i["options"]))
        w("")

# myth
w(f"## The myth: {myth['title']}\n")
w("English, the editor's Compose draft (a gap the composer could not fill is in [brackets]), and the translation made by hand from the spec, with the rules behind each choice. Back-translations are the editor's own (Liraasa → English).\n")
for s in ms:
    w(f"**{s['n']}. {s['en']}**\n")
    w(f"- Editor: *{s['editor']}*")
    w(f"- Spec: *{s['spec']}*")
    w(f"- Rules: {'; '.join(s['cites'])}")
    if s["editor_checked"]:
        w(f"- The checker on the editor's draft: {'; '.join(s['editor_checked'][:3])}")
    w(f"- Back-translation of the spec version: {s['spec_back']}")
    w(f"- Back-translation of the editor's draft: {s['editor_back']}")
    if s["gaps"]:
        w(f"- Spec gaps: {' '.join(s['gaps'])}")
    w("")

# phase 1 + 2
w("## Phase 1 and 2: rule inventory and implementation map\n")
w("Status: the checker's, from the Phase 4 cases (overrides from reading the code are marked †). Composer: spec-exact drafts / English cases.\n")
w("| ID | Source | Rule | Kind | Spec status | Checker | Composer | Where | Flags |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |")
for r in rules:
    s = status.get(r["source"])
    caught = sorted({d.split(" ")[1].rstrip(":") for x in res["results"] if x["rule"] == r["source"] and x["badResult"] for d in x["badResult"]["diagnostics"]})
    where = SECTION_WHERE.get(r["source"]) or ", ".join(sorted(cites.get(r["source"], []))) or (
        f"no check of its own; its cases are caught under {', '.join(caught)}" if caught else
        NON_EDITOR.get(r["kind"], "") if r["kind"] != "grammar" else
        "no dedicated check: the parser accepts the construction")
    cs = checker_status(r) + (" †" if r["source"] in OVERRIDE else "")
    if r["source"] in OVERRIDE:
        where = f"{where}; † {OVERRIDE[r['source']][1]}"
    w(f"| {r['id']} | {r['source']} | {md(r['title'])}: {md(r['statement'])} | {r['kind']} | {md(r['status'])} | {cs} | {s['composer'] if s and s['composer'] else ''} | {md(where)} | {md(' '.join(r['flags']))} |")
w("")

# phase 4
w("## Phase 4: rule tests\n")
w("Every case, from `tests/audit/cases.json`. Spec: the expected sentence checks clean. Break: the rule-breaking sentence is flagged (✓ citing the rule, ~ under another rule or as a note, ✗ not flagged). Composer: the editor's draft of the English.\n")
w("| # | Rule | English | Expected (spec) | Spec | Break | Composer draft |\n| --- | --- | --- | --- | --- | --- | --- |")
for r in res["results"]:
    b = r["badResult"]
    br = "" if b is None else ("✓" if b["flagged"] and b["cited"] else "~" if (b["flagged"] or b["weak"]) else "✗") + f" {md(r['bad'])}"
    comp = "" if r["composed"] is None else ("✓ " if r["composeMatch"] else "✗ ") + md(r["composed"])
    gap = " (spec gap)" if r.get("gap") else ""
    w(f"| {r['n']} | {r['ruleId']} {r['rule']}{gap} | {md(r['en'] or '')} | {md(r['good'])} | {'✓' if r['goodClean'] else '✗ ' + md('; '.join(r['goodIssues']))} | {br} | {comp} |")
w("")

# phase 3
w("## Phase 3: lexicon integrity\n")
w("**Words in shipped Liraasa text the editor cannot read** (lexicon examples, ruling, function-word and particle examples, the corpus, the author's song, the album read today, the editor's sample songbook):\n")
for u in lexa["unreadable"]:
    w(f"- `{u['word']}` ({u['kind']}, ×{u['count']}): {', '.join(u['sources'][:4])}")
w("\n**Shared senses:** " + "; ".join(f"{d['sense']}: {', '.join(d['words'])}" for d in lexa["duplicate_meanings"]))
w("\n**Near-homophones (roots one edit apart):** " + ", ".join(f"{p['a']}/{p['b']}" + (" (close sounds)" if p["kind"].startswith("close") else "") for p in lexa["near_homophones"]["pairs"]))
w("\n**Retired spellings in code and documents.** Only where they are not history by design: the guide's 'Reading older texts' list (K15), the protected-exception list (K16), the mislabelled corpus lines (L01), daigozayu's note (L04). "
  f"The other {len(lexa['retired_spellings_in_files'])} files that name a retired spelling are changelogs, ADRs, the album as recorded, and tests of the legacy readers: their old spellings are deliberate.")
w("\n**Did auto-correct migrate them?** No migration runs on stored writings when an edition changes (K13). The checker flags each old spelling (1.0:G19) with its current spelling as an automatic fix, now including an old spelling with -ri/-ti; the editor corrects every writing only after a rename in Learn's roots tool.")
w(f"\n**Ascended forms** ({len(lexa['ascended_not_sacred'])} whose gloss reads nothing sacred by a keyword test; {len(lexa['sacred_without_ascended'])} sacred concepts with no ascended form): see G03. Sacred concepts without -asa: " + ", ".join(f"{x['word']} ({x['gloss']})" for x in lexa["sacred_without_ascended"]) + ".")
w("\n**Compounds whose parts are not headwords:** none (headwords, attested image compounds, listed derivations).\n")

# phase 6
w("## Phase 6: the album against the 2.3 spec\n")
w("Each line read today (its current spelling), through the checker. Not judged: each is a place where the album and the current grammar differ.\n")
w("| Line | Reading | Rule | Finding | Text |\n| --- | --- | --- | --- | --- |")
for f in album["findings"]:
    w(f"| {f['track']}:{f['line']} | {f['reading'] or ''} | {f['rule']} | {md(f['message'][:160])} | {md(f['text'])} |")
w("")
open("review/audit-report.md", "w", encoding="utf8", newline="\n").write("\n".join(out) + "\n")
print("wrote review/audit-report.md;", len(out), "lines")
