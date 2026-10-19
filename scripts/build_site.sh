#!/usr/bin/env bash
# Assemble the GitHub Pages site into _site/ (or the directory given).
#
#   bash scripts/build_site.sh [OUT_DIR]
#
# The site root is the songbook editor. The page is copied to the root with
# <base href="editor/">, so every relative path it uses (checker/, learn/,
# liraasa-data.js, ../data/audio/) resolves exactly as it does in editor/.
# The editor is also served at editor/, and the published documents at codex/.
# Run by .github/workflows/pages.yml on every push to master; runs locally too.
set -euo pipefail

out="${1:-_site}"
rm -rf "$out"
mkdir -p "$out/data" "$out/codex"

# the editor, with its data bundle (build:editor writes the same file to data/editor/)
cp -r editor "$out/editor"
cp data/editor/liraasa-data.js "$out/editor/liraasa-data.js"
cp -r data/audio "$out/data/audio"

# the root page: the editor itself, resolving its paths from editor/
# (the page starts with <!doctype html> and has no <head> tag, and a second
# document is written inside its script: the base goes on line 2, before any
# relative URL, and the browser puts it in the head)
head -1 editor/index.html | grep -qi '^<!doctype html>' || { echo "build_site: editor/index.html must start with <!doctype html>" >&2; exit 1; }
sed '1a <base href="editor/">' editor/index.html > "$out/index.html"
[ "$(grep -c '<base href="editor/">' "$out/index.html")" = 1 ] || { echo "build_site: expected exactly one base tag" >&2; exit 1; }

# the documents and the lexicon, under codex/
for f in handoff/Liraasa_Invitation.html handoff/Liraasa_Invitation.pdf \
         handoff/Liraasa_2_3_Reference_Grammar.html handoff/Liraasa_2_3_Reference_Grammar.pdf \
         handoff/liraasa_2_3_llm.json; do
  [ -f "$f" ] && cp "$f" "$out/codex/"
done

# serve files as they are: no Jekyll processing
touch "$out/.nojekyll"
echo "site assembled in $out/"
