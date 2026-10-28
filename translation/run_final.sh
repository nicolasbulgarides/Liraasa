#!/usr/bin/env bash
# The last steps: refusals unscored, the last grammar fix, long paragraphs in pieces (old and new
# scored side by side), then the whole book scored twice in one sitting, the reports.
cd "$(dirname "$0")"
unset ANTHROPIC_API_KEY
python -X utf8 tools/fix_refused.py >> logs/driver.out 2>&1
python -X utf8 tools/grammar_fix.py >> logs/driver.out 2>&1
for i in 1 2 3 4; do
  python -X utf8 tools/chunk_long.py --workers 3 >> logs/driver.out 2>&1 && break
  sleep 60
done
for i in 1 2 3 4; do
  python -X utf8 tools/final_score.py >> logs/driver.out 2>&1 && break
  sleep 60
done
python -X utf8 tools/apply_overrides.py >> logs/driver.out 2>&1
python -X utf8 tools/review_md.py >> logs/driver.out 2>&1
touch FINISHED_ALL
