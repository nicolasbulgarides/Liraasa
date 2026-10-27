#!/usr/bin/env bash
# After the grammar fix: the meaning pass on 4.1 with the strongest model, then the steadier
# scoring, then the reports. Each step resumes where it stopped; usage limits are waited out.
cd "$(dirname "$0")"
unset ANTHROPIC_API_KEY
echo opus > fidelity_model.txt
python -X utf8 tools/grammar_fix.py >> logs/driver.out 2>&1
for i in 1 2 3 4 5 6; do
  python -X utf8 tools/fidelity.py --workers 3 >> logs/driver.out 2>&1
  python -X utf8 -c "
import json,os,sys
sys.exit(0 if any(json.loads(l).get('score',1)<0.85 and not json.loads(l).get('fidelity_tried') and not json.loads(l).get('fidelity') for f in os.listdir('out') for l in open('out/'+f,encoding='utf-8')) else 1)" || break
  sleep 60
done
python -X utf8 tools/rescore.py >> logs/driver.out 2>&1
python -X utf8 tools/grammar_fix.py >> logs/driver.out 2>&1
python -X utf8 tools/apply_overrides.py >> logs/driver.out 2>&1
python -X utf8 tools/review_md.py >> logs/driver.out 2>&1
touch FINISHED
