"""The author's grammar parser for the draft: the strict checker (src/core/grammar), kept running
as one Node process (scripts/check_batch.ts) and fed one JSON line per sentence.

    from parse import Parser
    p = Parser(); p.check("Maivo po lirala.")  # {ok, errors[], warnings[], unruled[], gloss}

The checker reads words, forms, slots and the clause and noun-phrase templates, so it is also
the lexcheck: a word that is not a listed form, closed-class word, numeral, derivation, -ti/-ri
form, motion-prefixed verb, a -san form allowed by 3.3:G148 / 3.6:G153, or a name, fails with
hard_rules[0]. Registered coinages are passed in `coined` (form -> slot n/v/a).
If the checker process dies it is restarted; after 3 failed restarts check() raises.
"""
import json
import os
import subprocess
import sys

import common


class Parser:
    def __init__(self):
        self.proc = None
        self.failures = 0
        self._start()

    def _start(self):
        npx = "npx.cmd" if os.name == "nt" else "npx"
        self.proc = subprocess.Popen(
            [npx, "tsx", "scripts/check_batch.ts"],
            cwd=common.REPO,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
            encoding="utf-8",
            bufsize=1,
        )

    def check(self, text, coined=None):
        for attempt in range(4):
            try:
                req = {"id": "x", "text": text, "coined": coined or {}}
                self.proc.stdin.write(json.dumps(req, ensure_ascii=False) + "\n")
                self.proc.stdin.flush()
                line = self.proc.stdout.readline()
                if not line:
                    raise RuntimeError("checker closed")
                out = json.loads(line)
                self.failures = 0
                return out
            except Exception as e:  # restart and retry
                self.failures += 1
                print(f"parser failure ({e}); restarting", file=sys.stderr)
                try:
                    self.proc.kill()
                except Exception:
                    pass
                self._start()
        raise RuntimeError("parser failed 4 times")

    def close(self):
        try:
            self.proc.stdin.close()
            self.proc.wait(timeout=10)
        except Exception:
            pass


if __name__ == "__main__":
    p = Parser()
    ref = common.load(common.LEXICON)
    samples = [row[0] for row in ref["examples"]["sentences"][:5]] + [r["liraasa"] for r in ref["recipes"][:5]]
    ok = 0
    for s in samples:
        r = p.check(s)
        ok += r["ok"]
        print("OK " if r["ok"] else "BAD", s, r["errors"][:2])
    print(f"{ok}/{len(samples)} parsed")
    p.close()
