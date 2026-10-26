#!/usr/bin/env python3
# The author's validate_patch.py (archive/patch_3_6/scripts/), with one change: the -san of a
# lexicalised diminutive is 3.6:G153, the author having renumbered 3.6's rulings past 3.5:G152 (ADR-0027).
"""Validate a merged Liraasa JSON against the patch that produced it.
Usage: python3 validate_patch.py MERGED_JSON PATCH_JSON [--modules=...]  (use the same --modules as apply_patch.py)
Checks: counts, duplicate headwords, new-root template and edit distance, compound parts,
verb rule on every new verb, presence of every patch form, words and operator order in every patch example."""
import json, re, sys
d = json.load(open(sys.argv[1])); p = json.load(open(sys.argv[2])); bad = []

def select_modules(p, argv):
    """Optional --modules=core,archetypes,... ; core is always included. Entries without a module key are always kept."""
    opt = [a for a in argv if a.startswith('--modules=')]
    mods = p.get('modules')
    if not mods: return p, None
    want = set(opt[0].split('=', 1)[1].split(',')) if opt else set(mods)
    want.add('core')
    unknown = want - set(mods)
    if unknown: raise SystemExit(f'unknown module(s): {sorted(unknown)}; available: {sorted(mods)}')
    keep = lambda x: x.get('module') in want if isinstance(x, dict) and 'module' in x else True
    q = dict(p)
    for k in ('function_words_add','rulings_add','roots_add','compounds_add','listed_derivations_add','lexicalised_diminutives_add',
              'restored_forms_add','recipes_add','english_aliases_add','test_sentences'):
        if k in q: q[k] = [x for x in q[k] if keep(x)]
    c = dict(p['counts'])
    c['new_roots'] = len(q['roots_add']); c['new_compounds'] = len(q['compounds_add'])
    c['new_listed_derivations'] = len(q['listed_derivations_add']); c['new_lexicalised_diminutives'] = len(q['lexicalised_diminutives_add'])
    c['restored_forms'] = len(q['restored_forms_add'])
    c['headwords_after'] = p['base_counts']['headwords'] + len(q['roots_add']) + len(q['compounds_add'])
    c['meaningful_forms_after'] = p['base_counts']['meaningful_forms'] + sum(len(e['forms']) for e in q['roots_add'] + q['compounds_add']) + len(q['restored_forms_add'])
    q['counts'] = c
    q['modules_applied'] = sorted(want)
    return q, sorted(want)

p, _mods = select_modules(p, sys.argv)
def hw(l): return l.split(':')[0].split(' ')[0]
lines = [l for ls in d['dictionary']['by_domain'].values() for l in ls]
heads = [hw(l) for l in lines]
if len(heads) != len(set(heads)): bad.append('duplicate headwords')
if len(heads) != d['dictionary']['count']['headwords']: bad.append('headword count mismatch')
words = set(heads)
for l in lines:
    for seg in l.split(':', 1)[1].split('|'):
        m = re.match(r'\s*(\S+)\s*\((\w+)\)', seg)
        if m and not seg.strip().startswith('('): words.add(m.group(1))
sw = d['small_words']
words |= {r[0] for r in sw['function_words']['rows']} | {r[0] for r in sw['correlatives']['rows']}
words |= {p_['form'] for p_ in sw['pronouns']} | {x['form'] for x in sw['discourse_particles']}
words |= {r[0] for r in sw['time_words']['rows']} | {r['liraasa'] for r in sw['numbers']['rules']}
for c in sw['colours']: words |= {c[k] for k in ('base','dark','vivid','gem','light')}
words |= set(d['word_building']['lexicalised_derivations']) | set(d['word_building']['lexicalised_diminutives'])
def verb(r):
    f = r[0]
    return r+'nia' if f=='n' else r+'sia' if f=='s' else r+'a' if f in 'aeiou' else r+f+'a'
def ed(a, b):
    dp = list(range(len(b)+1))
    for i in range(1, len(a)+1):
        prev, dp[0] = dp[0], i
        for j in range(1, len(b)+1):
            cur = dp[j]; dp[j] = min(dp[j]+1, dp[j-1]+1, prev+(a[i-1]!=b[j-1])); prev = cur
    return dp[-1]
newroots = {r['headword'] for r in p['roots_add']}
others = [w for w in words if w not in newroots and len(w) <= 7]
for r in p['roots_add']:
    h = r['headword']
    if not re.fullmatch(r'[^aeiou][aeiou][^aeiou]{1,2}[aeiou]', h): bad.append(f'root shape {h}')
    if any(h[i]==h[i+1] for i in range(len(h)-1)): bad.append(f'doubled letter {h}')
    if h.endswith(('ti','ri','na','vu','yo','asa')): bad.append(f'suffix-like ending {h}')
    near = [w for w in others if ed(h, w) < 2]
    if near: bad.append(f'root {h} within one edit of {near}')
for e in p['roots_add'] + p['compounds_add']:
    for slot, f in e['forms'].items():
        if f['form'] not in words: bad.append(f"missing form {f['form']}")
        if slot == 'v' and f['form'] != verb(e['headword']): bad.append(f"verb rule {e['headword']} -> {f['form']}")
COL={c['base'] for c in d['small_words']['colours']}
TIMEN={r[0] for r in d['small_words']['time_words']['rows'] if r[2]=='noun'}
for e in p['compounds_add']:
    for part in e['parts']:
        if part not in heads and part not in COL and part not in TIMEN: bad.append(f"compound {e['headword']}: part {part} not a headword")
for r in p['restored_forms_add']:
    if r['form'] not in words: bad.append(f"restored form missing {r['form']}")
    if r['slot'] == 'v' and r['form'] != verb(r['headword']): bad.append(f"verb rule {r['form']}")
OPS = {'po':4,'futu':4,'pressa':4,'noma':5,'ne':6,'povi':7,'nosi':7,'dagi':7,'musi':7,'suvi':7,'viki':7,'kopi':7,'tavki':8,'fututi':8,'hiro':9,'teki':9,'telvo':10,'vazdi':10,'fesmo':10,'roni':11,'tefa':11,'sahi':11,'bodu':12,'reve':12,'loki':12,'yehu':13,'gesu':13,'bisu':13,'vuda':13,'buyu':13,'tosu':13}
NAMES = {'ativan','herona','elesede','pitsa','hamburga','fransasan','amerika','fransa','deviasa','lumimare','velumare','liramare','mareasa','peta','lina','kipo','dorin','nilo','velina','aviya'}
COMPOUNDS={hw(l) for l in lines if '[' in l.split(':')[0]} | set(d['word_building']['lexicalised_derivations'])
G148=any(r['id']=='3.3:G148' for r in d.get('rulings',[]))
G152=any(r['id']=='3.6:G153' for r in d.get('rulings',[]))
def known(w):
    if G148 and w.endswith('san') and w[:-3] in COMPOUNDS: return True
    if G152 and w.endswith('san') and w[:-3] in d['word_building']['lexicalised_diminutives']: return True
    if '-' in w and all(x in words for x in w.split('-')): return True
    if any(w.startswith(p) and w[len(p):] in words for p in ('va-','du-','taro-','yave-','revo-')): return True
    return w in words or w in NAMES or (w.endswith('ri') and w[:-2] in words) or (w.endswith('-ne') and w[:-3] in words)
ex = [a for r in p.get('rulings_add', []) for a, _ in r.get('examples', [])] + [h['v3_0'] for h in p.get('hymn_test', [])] + [x['liraasa'] for x in p.get('prayer_test', [])] + [x['liraasa'] for x in p.get('test_sentences', [])] + [x['liraasa'] for x in p.get('recipes_add', [])]
for s in ex:
    t = re.findall(r"[a-z]+(?:-[a-z]+)*", re.sub(r'\(.*?\)', '', s).lower())
    for w in t:
        if not known(w): bad.append(f'unknown word {w} in: {s}')
    i = 0
    while i < len(t):
        if t[i] in OPS:
            j = i
            while j < len(t) and t[j] in OPS: j += 1
            run = t[i:j]; sl = [OPS[x] for x in run if x != 'ne']
            if sl != sorted(sl) or len(set(sl)) != len(sl): bad.append(f'operator order {run} in: {s}')
            if 'ne' in run and any(OPS[x] == 4 for x in run[run.index('ne'):]): bad.append(f'ne before tense in: {s}')
            i = j
        else: i += 1
print(f'checked {len(heads)} headwords, {len(p["roots_add"])} new roots, {len(p["compounds_add"])} compounds, {len(ex)} example sentences')
print('PASS' if not bad else 'FAIL'); [print(' -', b) for b in bad]
sys.exit(1 if bad else 0)
