#!/usr/bin/env bash
# The overnight run with its watchdog: if the driver dies, restart it after a minute; it resumes
# from its checkpoint. It ends when the book is finished (FINISHED) or the weekly usage cap is
# reached (STOPPED_WEEKLY_CAP). Never sets an API key: claude -p runs on the logged-in subscription.
cd "$(dirname "$0")"
unset ANTHROPIC_API_KEY
mkdir -p logs
while true; do
  python -X utf8 tools/run.py --workers "${WORKERS:-3}" >> logs/driver.out 2>&1
  code=$?
  if [ -f FINISHED ] || [ -f STOPPED_WEEKLY_CAP ]; then break; fi
  echo "[$(date -Is)] driver exited with $code; restarting in 60 s" >> logs/run.log
  sleep 60
done
