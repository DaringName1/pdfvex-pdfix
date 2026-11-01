// All counts are for text supplied by the caller. A chunk is a complete text unit
// (for example, a PDF page or an editor paragraph), never an arbitrary word slice.
const FALLBACK_WORD = /[\p{L}\p{N}\p{M}]+(?:['’][\p{L}\p{N}\p{M}]+)*/gu;
const SPACE = /^\s+$/u;
const pause = () => new Promise(resolve => setTimeout(resolve, 0));

function segmenter(locale, granularity) {
  if (typeof Intl?.Segmenter !== 'function') return null;
  try { return new Intl.Segmenter(locale || undefined, {granularity}); }
  catch { return new Intl.Segmenter(undefined, {granularity}); }
}

export function emptyTextStatistics() {
  return {words: 0, characters: 0, charactersNoSpaces: 0, paragraphs: null, units: 0,
    wordMethod: typeof Intl?.Segmenter === 'function' ? 'Intl.Segmenter' : 'Unicode fallback',
    characterMethod: typeof Intl?.Segmenter === 'function' ? 'grapheme clusters' : 'Unicode code points'};
}

// The async loop yields to the UI after a bounded number of segments. Aborting a
// scan never publishes its partial result as a completed count.
export async function addTextStatistics(stats, text, {locale, paragraphs, signal, batchSize = 4096} = {}) {
  if (signal?.aborted) throw signal.reason || new DOMException('Cancelled', 'AbortError');
  if (typeof text !== 'string') throw new TypeError('Statistics chunks must contain text.');
  const wordSegments = segmenter(locale, 'word');
  let steps = 0;
  if (wordSegments) {
    for (const part of wordSegments.segment(text)) {
      if (part.isWordLike) stats.words++;
      if (++steps % batchSize === 0) { if (signal?.aborted) throw signal.reason || new DOMException('Cancelled', 'AbortError'); await pause(); }
    }
  } else {
    for (const match of text.matchAll(FALLBACK_WORD)) {
      stats.words++;
      if (++steps % batchSize === 0) { if (signal?.aborted) throw signal.reason || new DOMException('Cancelled', 'AbortError'); await pause(); }
    }
  }
  const graphemes = segmenter(locale, 'grapheme');
  steps = 0;
  const characters = graphemes ? graphemes.segment(text) : text;
  for (const part of characters) {
    stats.characters++;
    if (!SPACE.test(graphemes ? part.segment : part)) stats.charactersNoSpaces++;
    if (++steps % batchSize === 0) { if (signal?.aborted) throw signal.reason || new DOMException('Cancelled', 'AbortError'); await pause(); }
  }
  if (Number.isSafeInteger(paragraphs) && paragraphs >= 0) stats.paragraphs = (stats.paragraphs ?? 0) + paragraphs;
  stats.units++;
  return stats;
}

export async function countTextStatistics(chunks, options = {}) {
  const stats = emptyTextStatistics();
  for await (const chunk of chunks) {
    const unit = typeof chunk === 'string' ? {text: chunk} : chunk;
    await addTextStatistics(stats, unit.text, {...options, paragraphs: unit.paragraphs});
  }
  return stats;
}
