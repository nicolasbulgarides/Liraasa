#!/usr/bin/env bash
# The overnight run with its watchdog: if the driver dies, restart it after a minute; it resumes
# from its checkpoint. It ends when the book is finished (FINISHED) or on a STOP file. Out of usage,
# the driver waits for the reset and goes on by itself. At most N model calls run at once, N from
# workers.txt (default 3), changeable while it runs. Never sets an API key: claude -p runs on the
# logged-in subscription.
cd "$(dirname "$0")"
unset ANTHROPIC_API_KEY
mkdir -p logs
while true; do
  python -X utf8 tools/run.py --workers 6 >> logs/driver.out 2>&1
  code=$?
  if [ -f FINISHED ] || [ -f STOP ]; then break; fi
  echo "[$(date -Is)] driver exited with $code; restarting in 60 s" >> logs/run.log
  sleep 60
done
