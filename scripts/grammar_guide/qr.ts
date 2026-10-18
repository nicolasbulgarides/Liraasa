/**
 * A QR code as inline SVG, drawn from the `qrcode` library's module matrix,
 * so the page needs no script and no image file. Dark ink on white in every
 * theme: a scanner needs the contrast.
 */
import QRCode from 'qrcode';
import { esc } from './html';

export function qrSvg(url: string, label: string, ink = '#000000'): string {
  const { modules } = QRCode.create(url, { errorCorrectionLevel: 'M' });
  const quiet = 4;
  const size = modules.size + quiet * 2;
  let d = '';
  for (let r = 0; r < modules.size; r += 1) {
    for (let c = 0; c < modules.size; c += 1) {
      if (modules.get(r, c)) d += `M${String(c + quiet)},${String(r + quiet)}h1v1h-1z`;
    }
  }
  return `<svg class="qr" viewBox="0 0 ${String(size)} ${String(size)}" role="img" aria-label="${esc(label)}" shape-rendering="crispEdges"><rect width="${String(size)}" height="${String(size)}" fill="#ffffff"/><path d="${d}" fill="${esc(ink)}"/></svg>`;
}
