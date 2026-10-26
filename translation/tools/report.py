"""The morning deliverables, rebuilt from out/, registry.json and state.json at any time.

    python translation/tools/report.py

Writes draft/2100_Dreams_Liraasa_DRAFT.md, draft/interlinear.md, decisions.md,
decisions.json and report.md. Safe to run while the driver runs.
"""
import json
import os
import re
from collections import Counter, defaultdict

import common

GRAMMAR = {
    "G-1": "Order of two adjectives: English order; fallback, one adjective in a raho clause",
    "G-2": "maivori and the listener: settled by 3.5:G152 (context)",
    "G-3": "Comparing an action: la kasi + adjective + tamo X",
    "G-4": "Durations: en + number + time noun (en dossa deya)",
    "G-5": "to + verb beyond purpose: a fime clause; sidu for the same subject",
    "G-6": "destined to: fatofa sidu VERB",
    "G-7": "Quantifier measures with kroti / krotiapo: avoided, rephrased",
    "G-8": "Decimals: a fraction or a rounded number",
    "G-9": "Quote-first dialogue (“…,” she said): not ruled by 2.3:G83; counted unruled, not wrong (the author, 2026-10-26)",
}
ORDER = ["grammar-default", "name", "coinage", "idiom", "wordplay", "reference", "register",
         "ambiguity", "paraphrase", "drift", "unparsed", "source-typo"]
CONF = {"high": 0.9, "medium": 0.6, "low": 0.3}


def records():
    out = []
    for ch in common.chapters():
        segs = common.read_jsonl(os.path.join(common.SEGMENTS, ch))
        recs = {r["id"]: r for r in common.read_jsonl(os.path.join(common.OUT, ch))}
        out.append((ch, segs, recs))
    return out


def conf_value(c):
    return CONF.get(str(c).lower(), 0.5)


def build_decisions(book, registry):
    items = {}

    def add(key, typ, title, seg, chosen, alts, conf, context, extra=None):
        d = items.get(key)
        if d is None:
            d = items[key] = {"type": typ, "title": title, "segments": [], "chosen": chosen,
                              "alternatives": [a for a in alts if a and a != chosen][:3],
                              "confidence": conf, "context": context, **(extra or {})}
        if seg and seg not in d["segments"]:
            d["segments"].append(seg)

    for _, segs, recs in book:
        for s in segs:
            r = recs.get(s["id"])
            if not r:
                continue
            for c in r.get("calls") or []:
                if not isinstance(c, dict):
                    continue
                typ = str(c.get("type", "ambiguity")).split("|")[0].strip() or "ambiguity"
                if typ == "grammar-default":
                    gid = re.search(r"G-\d", str(c.get("id", "")) + " " + str(c.get("english", "")))
                    gid = gid.group(0) if gid else "G-?"
                    add(f"grammar:{gid}", typ, f"{gid} · {GRAMMAR.get(gid, 'grammar default')}", s["id"],
                        c.get("rendering", ""), c.get("alternatives") or [], c.get("confidence", "medium"),
                        s["english"][:160])
                    continue
                eng = str(c.get("english", ""))[:60]
                if typ == "paraphrase" and eng == s["english"][:60]:
                    key = f"paraphrase:{s['id']}"
                else:
                    key = f"{typ}:{eng.lower()}"
                add(key, typ, eng or typ, s["id"], c.get("rendering", ""), c.get("alternatives") or [],
                    c.get("confidence", "medium"), s["english"][:160])
            if any(str(u).startswith("quote-first") for u in r.get("check", {}).get("unruled", [])):
                add("grammar:G-9", "grammar-default", f"G-9 · {GRAMMAR['G-9']}", s["id"],
                    "speech first, then its verb of saying, as the novel writes it",
                    ["the ruled order, VERB: “…”, for every quotation"], "medium", s["english"][:160])
            if r.get("status") == "unparsed" or (r.get("check") and not r["check"].get("ok")):
                add(f"unparsed:{s['id']}", "unparsed", f"{s['id']} did not pass the checker", s["id"],
                    r.get("liraasa", "")[:200], [], "low", s["english"][:160],
                    {"errors": r.get("check", {}).get("errors", [])[:5]})
            if r.get("score") is not None and r["score"] < 0.75:
                add(f"drift:{s['id']}", "drift", f"{s['id']} back-translation agreement {r['score']:.2f}", s["id"],
                    r.get("liraasa", "")[:200], [], "low", s["english"][:160],
                    {"back": r.get("back", "")[:200], "lost": r.get("lost", "")})
    for eng, v in registry.get("coinages", {}).items():
        add(f"coinage:{eng}", "coinage", eng, None, f"{v['liraasa']} ({'+'.join(v['parts'])})",
            v.get("alternatives", []), v.get("confidence", "medium"), "")
        items[f"coinage:{eng}"]["segments"] = list(v.get("uses", []))
    for t in common.load(os.path.join(common.ROOT, "source_typos.json"), []) or []:
        add(f"typo:{t['printed']}", "source-typo", f"{t['printed']} → {t['meant']}", None, t["meant"], [],
            "high", f"chapter {t['chapter']}")
    out = []
    for k, d in items.items():
        d["impact"] = round(max(1, len(d["segments"])) * (1 - conf_value(d["confidence"])), 2)
        out.append(d)
    out.sort(key=lambda d: (ORDER.index(d["type"]) if d["type"] in ORDER else len(ORDER), -d["impact"]))
    for i, d in enumerate(out, 1):
        d["id"] = f"D-{i:04d}"
    return out


def md_decisions(decs):
    lines = ["# 2100 Dreams in Liraasa: decisions for the author", "",
             "Every tough call the overnight draft made, provisionally. Sorted by section, then by impact "
             "(segments affected × (1 − confidence)). Mark another option, or write your own, and run "
             "`python translation/tools/apply_decisions.py`; **untouched entries count as accepted**.", ""]
    section = None
    names = {"grammar-default": "Grammar defaults (G-1 to G-8)", "name": "Names", "coinage": "Coinages",
             "idiom": "Idioms", "wordplay": "Wordplay", "reference": "References", "register": "Register",
             "ambiguity": "Ambiguities", "paraphrase": "Paraphrases", "drift": "Drift (low back-translation agreement)",
             "unparsed": "Unparsed segments", "source-typo": "Source typos"}
    for d in decs:
        if d["type"] != section:
            section = d["type"]
            lines += ["", f"# {names.get(section, section.title())}", ""]
        segs = d["segments"]
        uses = f" ({len(segs)} use{'s' if len(segs) != 1 else ''}: {', '.join(segs[:6])}{' …' if len(segs) > 6 else ''})" if segs else ""
        lines.append(f"## {d['id']} · {d['type']} · {d['title']}{uses}")
        if d.get("context"):
            lines.append(f"Context: \"{d['context']}\"")
        opts = [d["chosen"]] + d["alternatives"]
        for j, o in enumerate(opts):
            lines.append(f"{'Chosen: ' if j == 0 else '        '}[{'x' if j == 0 else ' '}] {chr(65 + j)}  {o}")
        lines.append(f"        [ ] {chr(65 + len(opts))}  your own: ______")
        if d.get("errors"):
            lines.append("Checker: " + " · ".join(d["errors"]))
        if d.get("back"):
            lines.append(f"Back-translation: \"{d['back']}\"" + (f" (lost: {d['lost']})" if d.get("lost") else ""))
        lines.append(f"Confidence: {d['confidence']}")
        lines.append("")
    return "\n".join(lines) + "\n"


def write(quiet=False):
    book = records()
    registry = common.load(common.REGISTRY, {"coinages": {}, "renderings": {}}) or {"coinages": {}, "renderings": {}}
    state = common.load(common.STATE, {}) or {}
    draft_dir = os.path.join(common.ROOT, "draft")
    os.makedirs(draft_dir, exist_ok=True)
    draft = ["# 2100 Dreams — Liraasa (draft)", "",
             "_A machine draft for the author's review: every segment carries its confidence. Not canon._", ""]
    inter = ["# 2100 Dreams — interlinear draft", ""]
    total = done = 0
    conf = Counter()
    first_ok = after_ok = 0
    by_ch = defaultdict(list)
    for ch, segs, recs in book:
        for s in segs:
            total += 1
            r = recs.get(s["id"])
            if not r:
                continue
            done += 1
            c = r.get("confidence") or ("unscored" if r.get("check", {}).get("ok") else "low")
            conf[c] += 1
            first_ok += bool(r.get("first_pass_ok"))
            after_ok += bool(r.get("check", {}).get("ok"))
            if r.get("score") is not None:
                by_ch[ch].append(r["score"])
            text = r.get("liraasa") or f"[no rendering] {r.get('gloss', '')}"
            if s["kind"] == "chapter":
                draft += ["", f"## {text}", ""]
            elif s["kind"] in ("part", "heading"):
                draft += ["", f"### {text}", ""]
            elif s["kind"] == "dateline":
                draft += [f"*{text}*", ""]
            else:
                draft += [f"{text} <sup>[{s['id']} · {c}]</sup>", ""]
            inter += [f"### {s['id']} · {c}" + (f" · agreement {r['score']:.2f}" if r.get("score") is not None else ""), "",
                      f"> {s['english']}", "", f"**{r.get('liraasa', '')}**", "", f"_{r.get('gloss', '')}_", ""]
            if r.get("back"):
                inter += [f"Back: {r['back']}", ""]
    with open(os.path.join(draft_dir, "2100_Dreams_Liraasa_DRAFT.md"), "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(draft) + "\n")
    with open(os.path.join(draft_dir, "interlinear.md"), "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(inter) + "\n")
    decs = build_decisions(book, registry)
    with open(os.path.join(common.ROOT, "decisions.md"), "w", encoding="utf-8", newline="\n") as f:
        f.write(md_decisions(decs))
    common.save(os.path.join(common.ROOT, "decisions.json"), decs)
    # the report
    scored = [(r.get("score", 1), s["id"], s["english"], r.get("liraasa", ""), r.get("lost", ""))
              for ch, segs, recs in book for s in segs if (r := recs.get(s["id"])) and r.get("score") is not None]
    scored.sort()
    pauses = state.get("pauses", [])
    rep = ["# 2100 Dreams draft translation: report", "",
           f"Updated {state.get('events', [{}])[-1].get('at', '') if state.get('events') else ''}.", "",
           "## Status", "",
           f"- Segments translated: **{done} of {total}**",
           f"- Parser: {state.get('parser_mode', 'strict checker')} (src/core/grammar via scripts/check_batch.ts)",
           f"- Strategy from calibration: **{state.get('strategy') or 'not yet calibrated'}**"
           + (f" (calibration: pass {state['calibration']['pass_rate']:.0%}, agreement {state['calibration']['agreement']:.2f}, coinages in {state['calibration']['coinage_rate']:.0%} of segments)" if state.get("calibration") else ""),
           f"- Parser pass rate: first attempt {first_ok / done:.0%}, after retries {after_ok / done:.0%}" if done else "- Parser pass rate: —",
           f"- Model calls so far: {state.get('calls', 0)}", "",
           "## Confidence", ""]
    for k in ("high", "medium", "low", "unscored"):
        rep.append(f"- {k}: {conf.get(k, 0)}")
    rep += ["", "## Back-translation agreement by chapter", ""]
    for ch in sorted(by_ch):
        v = by_ch[ch]
        rep.append(f"- {ch[:-6]}: mean {sum(v) / len(v):.2f} over {len(v)} segments")
    rep += ["", "## Decisions by type", ""]
    for t, n in Counter(d["type"] for d in decs).most_common():
        rep.append(f"- {t}: {n}")
    rep += ["", f"Coinages proposed: {len(registry.get('coinages', {}))}", "",
            "## Strategy changes and events", ""]
    rep += [f"- {e['at']}: {e['what']}" for e in state.get("events", [])]
    rep += ["", "## Usage-limit pauses and outages", ""]
    rep += [f"- {p['at']}: {p['why']}" + (f", {p['minutes']} min" if p.get("minutes") else "") for p in pauses] or ["- none"]
    rep += ["", "## The 20 lowest-agreement segments", ""]
    for sc, sid, en, li, lost in scored[:20]:
        rep += [f"- **{sid}** ({sc:.2f}): {en[:140]}…", f"  - {li[:160]}", f"  - lost: {lost}"]
    rep += ["", "## Grammar defaults: smoke test through the checker (2026-10-25)", "",
            "- G-1 two adjectives: reported unruled, accepted; fallback raho clause accepted",
            "- G-2 maivori: settled by 3.5:G152 since the brief was written",
            "- G-3 la kasi benasan tamo X: accepted; muya-krono kasi tamo X: rejected (2.5:G106), not used",
            "- G-4 en dossa deya: accepted; the clause fallback: accepted",
            "- G-5 fime clause: accepted",
            "- G-6 fatofa: a verb (to be fated); `fatofa sidu VERB` accepted, bare `fatofa VERB` rejected",
            "- G-8 dossa de tressa: accepted",
            ""]
    with open(os.path.join(common.ROOT, "report.md"), "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(rep) + "\n")
    if not quiet:
        print(f"report: {done}/{total} segments; {len(decs)} decisions")


if __name__ == "__main__":
    write()
