/**
 * The cover's ornaments: a sun with a heart at its core between two
 * crescent moons, a sacred-geometry rosette behind the title, a field of
 * stars, filigree corners, and a staff of music that rises and falls like a
 * melody.
 *
 * Every shape is computed here, so the cover is pure inline SVG with no
 * images or fonts to fetch. Colours come from the stylesheet's custom
 * properties (`--sun`, `--moon`, `--lir`), so the art follows light, dark and
 * print. Star positions use a seeded generator, so a rebuild writes the same
 * file and git diffs stay quiet. All of it is decorative and hidden from
 * assistive technology.
 */

const TAU = Math.PI * 2;

function f(x: number): string {
  return Number(x.toFixed(2)).toString();
}

/** A small deterministic PRNG (mulberry32), so the star field never moves between builds. */
function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function svg(viewBox: string, cls: string, body: string): string {
  return `<svg class="${cls}" viewBox="${viewBox}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

/** A heart centred on (cx, cy), `s` wide. */
function heart(cx: number, cy: number, s: number, cls: string): string {
  const k = s / 28;
  const p = (x: number, y: number) => `${f(cx + x * k)},${f(cy + y * k)}`;
  return `<path class="${cls}" d="M${p(0, 10)} C${p(-4, 6)} ${p(-14, 0)} ${p(-14, -7)} C${p(-14, -13)} ${p(-9, -16)} ${p(-5, -16)} C${p(-2, -16)} ${p(0, -14)} ${p(0, -11)} C${p(0, -14)} ${p(2, -16)} ${p(5, -16)} C${p(9, -16)} ${p(14, -13)} ${p(14, -7)} C${p(14, 0)} ${p(4, 6)} ${p(0, 10)} Z"/>`;
}

/** A four-pointed sparkle. */
function sparkle(cx: number, cy: number, r: number, cls: string): string {
  const w = r * 0.22;
  return `<path class="${cls}" d="M${f(cx)},${f(cy - r)} Q${f(cx + w)},${f(cy - w)} ${f(cx + r)},${f(cy)} Q${f(cx + w)},${f(cy + w)} ${f(cx)},${f(cy + r)} Q${f(cx - w)},${f(cy + w)} ${f(cx - r)},${f(cy)} Q${f(cx - w)},${f(cy - w)} ${f(cx)},${f(cy - r)} Z"/>`;
}

/** A crescent opening to the right; mirror it for the other phase. */
function crescent(cx: number, cy: number, r: number, cls: string): string {
  return `<path class="${cls}" d="M${f(cx)},${f(cy - r)} A${f(r)},${f(r)} 0 0,0 ${f(cx)},${f(cy + r)} A${f(r * 0.62)},${f(r)} 0 0,1 ${f(cx)},${f(cy - r)} Z"/>`;
}

/** The radiant sun: tapered rays, alternating long and short, round a disc and a heart. */
function sun(cx: number, cy: number): string {
  const rays: string[] = [];
  const n = 32;
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * TAU - Math.PI / 2;
    const long = i % 2 === 0;
    const r1 = 40;
    const r2 = long ? 74 : 58;
    const half = long ? 0.06 : 0.045;
    const pt = (r: number, da: number) =>
      `${f(cx + r * Math.cos(a + da))},${f(cy + r * Math.sin(a + da))}`;
    rays.push(
      `<polygon class="${long ? 'ray' : 'ray short'}" points="${pt(r1, -half)} ${pt(r2, 0)} ${pt(r1, half)}"/>`,
    );
  }
  // A ring of dots between the rays and the disc.
  const dots: string[] = [];
  for (let i = 0; i < 16; i += 1) {
    const a = (i / 16) * TAU;
    dots.push(
      `<circle class="sun-dot" cx="${f(cx + 35 * Math.cos(a))}" cy="${f(cy + 35 * Math.sin(a))}" r="1.3"/>`,
    );
  }
  return `<g>${rays.join('')}
<circle class="sun-disc" cx="${f(cx)}" cy="${f(cy)}" r="30"/>
<circle class="sun-ring" cx="${f(cx)}" cy="${f(cy)}" r="38"/>
${dots.join('')}
${heart(cx, cy + 2, 30, 'core-heart')}</g>`;
}

/** Sun between waxing and waning moons, joined by a dotted orbit, with sparkles. */
export function emblem(): string {
  const cy = 100;
  const orbit = `<path class="orbit" d="M70,${f(cy)} A170,96 0 0,1 410,${f(cy)}"/><path class="orbit" d="M70,${f(cy)} A170,96 0 0,0 410,${f(cy)}"/>`;
  const moons = `${crescent(95, cy, 26, 'moon')}<g transform="translate(480,0) scale(-1,1)">${crescent(95, cy, 26, 'moon')}</g>`;
  const sparkles = [
    [150, 46, 6],
    [330, 46, 6],
    [150, 154, 5],
    [330, 154, 5],
    [40, 70, 4],
    [440, 70, 4],
    [40, 132, 3],
    [440, 132, 3],
    [240, 8, 4],
    [240, 192, 4],
  ]
    .map(([x, y, r]) => sparkle(x ?? 0, y ?? 0, r ?? 0, 'spark'))
    .join('');
  const smallHearts = `${heart(118, cy, 9, 'small-heart')}${heart(362, cy, 9, 'small-heart')}`;
  return svg(
    '0 0 480 200',
    'cover-emblem',
    `${orbit}${moons}${smallHearts}${sparkles}${sun(240, cy)}`,
  );
}

/** A rosette of overlapping circles with radial spokes: the flower behind the title. */
export function rosette(): string {
  const parts: string[] = [];
  for (const r of [290, 270, 210]) parts.push(`<circle cx="0" cy="0" r="${String(r)}"/>`);
  parts.push('<circle class="dash" cx="0" cy="0" r="240"/>');
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * TAU;
    parts.push(`<circle cx="${f(105 * Math.cos(a))}" cy="${f(105 * Math.sin(a))}" r="105"/>`);
  }
  for (let i = 0; i < 48; i += 1) {
    const a = (i / 48) * TAU;
    const r1 = i % 2 === 0 ? 210 : 225;
    parts.push(
      `<line x1="${f(r1 * Math.cos(a))}" y1="${f(r1 * Math.sin(a))}" x2="${f(270 * Math.cos(a))}" y2="${f(270 * Math.sin(a))}"/>`,
    );
  }
  // A twelve-pointed star woven through the rosette.
  const star: string[] = [];
  for (let i = 0; i < 12; i += 1) {
    const a = (i * 5 * TAU) / 12 - Math.PI / 2;
    star.push(`${f(210 * Math.cos(a))},${f(210 * Math.sin(a))}`);
  }
  parts.push(`<polygon points="${star.join(' ')}"/>`);
  return svg('-300 -300 600 600', 'cover-rosette', parts.join(''));
}

/** Scattered stars and sparkles across the whole cover. */
export function starfield(): string {
  const rand = seeded(1418);
  const parts: string[] = [];
  for (let i = 0; i < 90; i += 1) {
    const x = rand() * 1000;
    const y = rand() * 1400;
    // Keep the centre clear for the title.
    if (x > 220 && x < 780 && y > 380 && y < 1000) continue;
    const r = 0.8 + rand() * 2.2;
    parts.push(
      rand() < 0.22
        ? sparkle(x, y, r * 3.2, 'field-spark')
        : `<circle class="field-star" cx="${f(x)}" cy="${f(y)}" r="${f(r)}"/>`,
    );
  }
  // `slice` so the field fills the cover at any aspect without stretching a star.
  return svg('0 0 1000 1400', 'cover-stars', parts.join('')).replace(
    '<svg ',
    '<svg preserveAspectRatio="xMidYMid slice" ',
  );
}

/** One filigree corner; the stylesheet rotates copies into the other three. */
export function corner(pos: 'tl' | 'tr' | 'bl' | 'br'): string {
  const arcs = [30, 52, 74, 96]
    .map(
      (r, i) =>
        `<path class="${i % 2 === 0 ? '' : 'dash'}" d="M${String(r)},4 A${String(r - 4)},${String(r - 4)} 0 0,1 4,${String(r)}"/>`,
    )
    .join('');
  const body = `${arcs}<path d="M4,4 L60,60"/>${sparkle(68, 68, 9, 'corner-spark')}${heart(24, 24, 12, 'corner-heart')}<circle class="corner-dot" cx="110" cy="8" r="2"/><circle class="corner-dot" cx="8" cy="110" r="2"/>`;
  return svg('0 0 120 120', `cover-corner ${pos}`, body);
}

/** A divider: two rules with diamonds, and a heart between two eighth notes. */
export function divider(): string {
  const note = (x: number) =>
    `<g transform="translate(${String(x)},14)"><ellipse class="note-head" cx="0" cy="0" rx="4.6" ry="3.3" transform="rotate(-20)"/><line class="note-stem" x1="4" y1="-1" x2="4" y2="-17"/><path class="note-flag" d="M4,-17 q6,4 4,10"/></g>`;
  return svg(
    '0 0 360 30',
    'cover-divider',
    `<line x1="20" y1="15" x2="138" y2="15"/><line x1="222" y1="15" x2="340" y2="15"/>
<rect class="diamond" x="12" y="11" width="8" height="8" transform="rotate(45 16 15)"/><rect class="diamond" x="340" y="11" width="8" height="8" transform="rotate(45 344 15)"/>
${note(152)}${heart(180, 15, 18, 'core-heart')}${note(204)}`,
  );
}

/**
 * A five-line staff that rolls like a wave, carrying a melody: quarter notes,
 * beamed eighths, a half note, and one note whose head is a heart. The ends
 * fade out through a gradient mask.
 */
export function melody(): string {
  const W = 640;
  const base = 42;
  const gap = 9;
  const wave = (x: number) => 14 * Math.sin((x / W) * TAU * 1.5 + 0.6);
  const lines: string[] = [];
  for (let i = 0; i < 5; i += 1) {
    const pts: string[] = [];
    for (let x = 0; x <= W; x += 8) pts.push(`${String(x)},${f(base + i * gap + wave(x))}`);
    lines.push(`<polyline class="staff" points="${pts.join(' ')}"/>`);
  }

  // Steps count down from the top line in half-gaps: 0 = top line, 8 = bottom line.
  type Kind = 'q' | 'h' | 'e' | 'heart';
  const tune: [number, number, Kind][] = [
    [70, 6, 'q'],
    [110, 4, 'q'],
    [150, 5, 'e'],
    [178, 3, 'e'],
    [222, 2, 'h'],
    [270, 4, 'q'],
    [318, 3, 'heart'],
    [366, 5, 'e'],
    [394, 6, 'e'],
    [438, 4, 'q'],
    [480, 2, 'e'],
    [508, 1, 'e'],
    [556, 3, 'h'],
  ];
  const notes: string[] = [];
  const stemTops: { x: number; y: number; kind: Kind }[] = [];
  for (const [x, step, kind] of tune) {
    const y = base + (step * gap) / 2 + wave(x);
    if (kind === 'heart') {
      notes.push(heart(x, y, 15, 'note-heart'));
      notes.push(
        `<line class="note-stem" x1="${f(x + 6)}" y1="${f(y - 3)}" x2="${f(x + 6)}" y2="${f(y - 30)}"/>`,
      );
      continue;
    }
    notes.push(
      `<ellipse class="${kind === 'h' ? 'note-head hollow' : 'note-head'}" cx="${f(x)}" cy="${f(y)}" rx="6" ry="4.3" transform="rotate(-20 ${f(x)} ${f(y)})"/>`,
    );
    const top = y - 30;
    notes.push(
      `<line class="note-stem" x1="${f(x + 5.6)}" y1="${f(y - 1.5)}" x2="${f(x + 5.6)}" y2="${f(top)}"/>`,
    );
    stemTops.push({ x: x + 5.6, y: top, kind });
  }
  // Beam consecutive eighth notes in pairs.
  const eighths = stemTops.filter((s) => s.kind === 'e');
  for (let i = 0; i + 1 < eighths.length; i += 2) {
    const a = eighths[i];
    const b = eighths[i + 1];
    if (a === undefined || b === undefined) continue;
    notes.push(
      `<polygon class="beam" points="${f(a.x - 0.8)},${f(a.y)} ${f(b.x + 0.8)},${f(b.y)} ${f(b.x + 0.8)},${f(b.y + 4.5)} ${f(a.x - 0.8)},${f(a.y + 4.5)}"/>`,
    );
  }
  // Little sparkles drifting up off the melody.
  const drift = [
    [130, 18, 4],
    [246, 6, 3],
    [342, 14, 5],
    [462, 4, 3],
    [530, 20, 4],
  ]
    .map(([x, y, r]) => sparkle(x ?? 0, y ?? 0, r ?? 0, 'spark'))
    .join('');

  const defs = `<defs><linearGradient id="staff-fade" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".14" stop-color="#fff" stop-opacity="1"/><stop offset=".86" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="staff-mask"><rect x="0" y="0" width="${String(W)}" height="130" fill="url(#staff-fade)"/></mask></defs>`;
  return svg(
    `0 -10 ${String(W)} 140`,
    'cover-melody',
    `${defs}<g mask="url(#staff-mask)">${lines.join('')}${notes.join('')}${drift}</g>`,
  );
}
