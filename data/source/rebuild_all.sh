#!/bin/sh
# Rebuild Liraasa 1.0 end to end. Run from the project root (the folder containing tools/ and corpus/).
# Requires python3 with openpyxl, node with the 'docx' package, and LibreOffice only for recalculating workbook formulas.
set -e
SRC=${1:-lexicon_0_8_rc2.json}
mkdir -p out final corpus/quickstart
python3 tools/build_1_0.py "$SRC" out/liraasa_1_0.json
python3 tools/migrate_text.py out/liraasa_1_0.json corpus/legacy_0_8 corpus/songs_1_0
python3 tools/gloss.py out/liraasa_1_0.json corpus/demo_1_0/*.txt --json > out/reverse_gloss.json
python3 tools/compare.py out/reverse_gloss.json out/comparison_1_0.json
python3 tools/stats.py "$SRC" out/liraasa_1_0.json out/stats_1_0.json > /dev/null
python3 tools/validate.py out/liraasa_1_0.json --baseline "$SRC" --corpus corpus/demo_1_0 corpus/songs_1_0 corpus/guide_examples corpus/quickstart --out out/validation_1_0.json
python3 tools/build_workbooks.py out/liraasa_1_0.json out/validation_1_0.json out/stats_1_0.json final
python3 -c "import sys,json; sys.path.insert(0,'tools'); from guide_content import blocks; D=json.load(open('out/liraasa_1_0.json')); V=json.load(open('out/validation_1_0.json')); S=json.load(open('out/stats_1_0.json')); json.dump({'blocks':blocks(D,V,S),'counts':V['summary']['counts']},open('out/guide_blocks.json','w'),ensure_ascii=False)"
node tools/render_guide.js out/guide_blocks.json final/Liraasa_1_0_Grammar_Guide.docx
python3 tools/build_docs.py final
