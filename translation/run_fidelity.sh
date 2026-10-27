#!/usr/bin/env bash
# The meaning-first pass with its watchdog: restart on a crash; it resumes (tried segments are
# marked). Ends when the pass logs it is done, or on a STOP file. No API key: the subscription.
cd "$(dirname "$0")"
unset ANTHROPIC_API_KEY
while true; do
  python -X utf8 tools/fidelity.py --workers "$(cat workers.txt 2>/dev/null || echo 3)" >> logs/driver.out 2>&1
  if grep -q "meaning-first pass done" logs/run.log && ! python -X utf8 -c "
import json,os,sys
sys.exit(0 if any(json.loads(l).get('score',1)<0.85 and not json.loads(l).get('fidelity_tried') and not json.loads(l).get('fidelity') for f in os.listdir('out') for l in open('out/'+f,encoding='utf-8')) else 1)"; then python -X utf8 tools/apply_overrides.py >> logs/driver.out 2>&1; touch FINISHED; break; fi
  [ -f STOP ] && break
  sleep 60
done
