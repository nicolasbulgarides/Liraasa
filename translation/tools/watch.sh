#!/usr/bin/env bash
# Progress events for a watcher: a summary every 15 minutes, every run.log event that is not a
# routine batch line at once (pauses, restarts, strategy changes, phases), and a
# warning if nothing has been logged for 45 minutes. Exits when the run finishes or stops.
cd "$(dirname "$0")/.."
count() {
  python -X utf8 -c "
import json,os
n=t=ok=0; sc=[]
for f in sorted(os.listdir('segments')):
  t+=sum(1 for _ in open('segments/'+f,encoding='utf-8'))
  if os.path.exists('out/'+f):
    for l in open('out/'+f,encoding='utf-8'):
      try: r=json.loads(l)
      except Exception: continue
      n+=1; ok+=bool(r.get('check',{}).get('ok'))
      if r.get('score') is not None: sc.append(r['score'])
m=f', {len(sc)} scored (meaning kept {sum(sc)/len(sc):.2f})' if sc else ''
print(f'{n}/{t} translated ({100*n//max(t,1)}%), {ok} pass the checker{m}')" 2>/dev/null
}
seen=$(wc -l < logs/run.log)
quiet=0
ticks=0
while true; do
  now=$(wc -l < logs/run.log)
  if [ "$now" -gt "$seen" ]; then
    # important events at once; routine batch lines only feed the periodic summary
    tail -n +"$((seen + 1))" logs/run.log | head -n "$((now - seen))" | grep -v " parse (" | while IFS= read -r line; do
      echo "$line  ·  $(count)"
    done
    seen=$now
    quiet=0
  else
    quiet=$((quiet + 1))
    if [ "$quiet" -eq 45 ]; then echo "WARNING: nothing logged for 45 minutes  ·  $(count)"; fi
  fi
  ticks=$((ticks + 1))
  if [ $((ticks % ${EVERY:-15})) -eq 0 ]; then echo "[$(date +%H:%M)] progress: $(count)"; fi
  if [ -f FINISHED ]; then echo "FINISHED  ·  $(count)"; exit 0; fi
  if [ -f STOPPED_WEEKLY_CAP ]; then echo "STOPPED: weekly usage cap  ·  $(count)"; exit 0; fi
  sleep 60
done
