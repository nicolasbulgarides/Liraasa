#!/usr/bin/env bash
# After run_more.sh: unscore refusals, re-translate long paragraphs in pieces, score the changed
# ones three times, a last grammar fix, the reports. Waits for FINISHED; usage limits are waited out.
cd "$(dirname "$0")"
unset ANTHROPIC_API_KEY
until [ -f FINISHED ]; do sleep 60; done
rm -f FINISHED
python -X utf8 tools/fix_refused.py >> logs/driver.out 2>&1
for i in 1 2 3 4; do
  python -X utf8 tools/chunk_long.py --workers 3 >> logs/driver.out 2>&1 && break
  sleep 60
done
python -X utf8 tools/rescore.py >> logs/driver.out 2>&1
python -X utf8 tools/grammar_fix.py >> logs/driver.out 2>&1
python -X utf8 tools/review_md.py >> logs/driver.out 2>&1
touch FINISHED_ALL
