// Bounded, literal page text comparison. Content is returned as data, never HTML.
const MAX_CHARS = 100_000, MAX_TOKENS = 8_000, MAX_CELLS = 250_000;
export function textChanges(before, after) {
  if (typeof before !== 'string' || typeof after !== 'string') throw new Error('Page text must be a string.');
  if (before.length > MAX_CHARS || after.length > MAX_CHARS) return { unavailable: 'This page has too much text for a detailed comparison. Review its artwork.', parts: [] };
  const a = before.match(/\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu) || [];
  const b = after.match(/\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu) || [];
  if (a.length > MAX_TOKENS || b.length > MAX_TOKENS) return { unavailable: 'This page has too many words for a detailed comparison. Review its artwork.', parts: [] };
  const parts = [];
  const add = (kind, value) => { if (!value) return; const last = parts.at(-1); if (last?.kind === kind) last.text += value; else parts.push({ kind, text: value }); };
  let prefix = 0, suffix = 0;
  while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) prefix++;
  while (suffix < a.length - prefix && suffix < b.length - prefix && a[a.length-1-suffix] === b[b.length-1-suffix]) suffix++;
  add('same', a.slice(0, prefix).join(''));
  const x = a.slice(prefix, a.length-suffix), y = b.slice(prefix, b.length-suffix);
  const coarse = (x.length+1)*(y.length+1) > MAX_CELLS;
  if (coarse) { add('removed', x.join('')); add('added', y.join('')); }
  else {
    const width = y.length+1, table = new Uint16Array((x.length+1)*width);
    for (let i = x.length-1; i >= 0; i--) for (let j = y.length-1; j >= 0; j--) table[i*width+j] = x[i] === y[j] ? table[(i+1)*width+j+1]+1 : Math.max(table[(i+1)*width+j], table[i*width+j+1]);
    let i = 0, j = 0;
    while (i < x.length || j < y.length) {
      if (i < x.length && j < y.length && x[i] === y[j]) { add('same', x[i++]); j++; }
      else if (i < x.length && (j === y.length || table[(i+1)*width+j] >= table[i*width+j+1])) add('removed', x[i++]);
      else add('added', y[j++]);
    }
  }
  add('same', suffix ? a.slice(a.length-suffix).join('') : '');
  return { parts, coarse, changed: parts.some(p => p.kind !== 'same') };
}

// Both images occupy the same white canvas at the same PDF-point scale.
// Threshold ignores tiny rasterization noise; this is a preview, not proof of equivalence.
export function pixelChanges(before, after, width, height) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width*height > 800_000 || before.length !== width*height*4 || after.length !== before.length) throw new Error('Visual comparison exceeds its pixel limit.');
  const pixels = new Uint8ClampedArray(before.length); let changed = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const delta = Math.max(Math.abs(before[i]-after[i]), Math.abs(before[i+1]-after[i+1]), Math.abs(before[i+2]-after[i+2]));
    if (delta > 24) { pixels[i] = 226; pixels[i+1] = 70; pixels[i+2] = 114; changed++; }
    else { pixels[i] = Math.round(after[i]*.2+204); pixels[i+1] = Math.round(after[i+1]*.2+204); pixels[i+2] = Math.round(after[i+2]*.2+204); }
    pixels[i+3] = 255;
  }
  return { pixels, changed, fraction: changed/(width*height) };
}
