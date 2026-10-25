#!/usr/bin/env python3
"""Apply a Liraasa patch (3.0 onto 2.5, or 3.1 onto 3.0) to a base JSON.
Usage: python3 apply_patch.py BASE_JSON PATCH_JSON OUT_JSON
Additions only; refuses to run if the base is not the expected 2.5 file or if anything would be overwritten."""
import json, re, sys
base_p, patch_p, out_p = sys.argv[1:4]
d = json.load(open(base_p)); p = json.load(open(patch_p))
assert d['dictionary']['count']['headwords'] == p['base_counts']['headwords'], f"base is not Liraasa {p['base_version']} (headword count differs)"
def hw(line): return line.split(':')[0].split(' ')[0]
by = d['dictionary']['by_domain']
heads = {hw(l): (dom, i) for dom, ls in by.items() for i, l in enumerate(ls)}
all_words = set()
for ls in by.values():
    for l in ls:
        all_words.add(hw(l))
        for seg in l.split(':', 1)[1].split('|'):
            m = re.match(r'\s*(\S+)\s*\((\w+)\)', seg)
            if m and not seg.strip().startswith('('): all_words.add(m.group(1))
fw_rows = d['small_words']['function_words']['rows']
all_words |= {r[0] for r in fw_rows}
def guard(w, what):
    if w in all_words: raise SystemExit(f'ABORT: {what} {w} already exists in base')
    all_words.add(w)
# 1 function words
for f in p['function_words_add']:
    guard(f['form'], 'function word')
    fw_rows.append([f['form'], f['meaning'], f['use'], f['example_liraasa'], f['example_english']])
# 2 roots and compounds -> dictionary lines
for e in p['roots_add'] + p['compounds_add']:
    for s in e['forms'].values(): guard(s['form'], 'form')
    by.setdefault(e['domain'], []).append(e['dictionary_line'])
# 3 restored forms appended to existing lines
for r in p['restored_forms_add']:
    dom, i = heads[r['headword']]
    guard(r['form'], 'restored form')
    by[dom][i] = by[dom][i] + ' | ' + r['append_to_line']
for dom in by: by[dom].sort(key=lambda l: hw(l).lower())
# 4 derivations and diminutives
wb = d['word_building']
for x in p['listed_derivations_add']:
    guard(x['form'], 'derivation'); wb['lexicalised_derivations'][x['form']] = f"{x['meaning']}: {x['base']} + {x['suffix']}"
for x in p['lexicalised_diminutives_add']:
    guard(x['form'], 'diminutive'); wb['lexicalised_diminutives'][x['form']] = f"{x['meaning']}: {x['base']} + -ti"
# 5 rulings, open questions, counts, version strings
for r in p.get('rulings_add', []):
    d['rulings'].append(dict(id=r['id'], topic=r['topic'], rule=r['rule'],
        examples=[dict(liraasa=a, english=b) for a, b in r.get('examples', [])],
        ungrammatical=[dict(liraasa=a, why=b) for a, b in r.get('ungrammatical', [])],
        **({'resolves_open_question': r['resolves']} if r.get('resolves') else {})))
if 'open_questions_after' in p: d['open_questions_do_not_resolve'] = p['open_questions_after']
for r in p.get('recipes_add', []): d['recipes'].append(r)
d['dictionary']['count'] = dict(headwords=p['counts']['headwords_after'], meaningful_forms=p['counts']['meaningful_forms_after'])
d['title'] = d['title'].replace(p['base_version'], p['target_version'])
d.setdefault('patch_history', []).append(dict(patch=p['patch'], from_version=p['base_version'], to_version=p['target_version'], status=p['status']))
json.dump(d, open(out_p, 'w'), ensure_ascii=False, indent=1)
print('applied:', p['counts'])
