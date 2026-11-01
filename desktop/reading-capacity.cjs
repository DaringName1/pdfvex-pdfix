'use strict';

const os = require('node:os');

const MiB = 1024 * 1024;
const MAX_READING_PDF_BYTES = 1024 * MiB;
const READING_MEMORY_RESERVE = 768 * MiB;
const WHOLE_FILE_TOOL_BYTES = 100 * MiB;
const MIN_RANGE_WORKING_BYTES = (2 * 64 + 8 + 4) * MiB;

function readingMemoryRequired(bytes) {
  const size = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
  return 3 * size + READING_MEMORY_RESERVE + MIN_RANGE_WORKING_BYTES;
}

function safeGraphicsStatus(graphics) {
  if (!graphics || typeof graphics !== 'object' || Array.isArray(graphics)) return {};
  const result = {};
  for (const key of ['status', 'webgl', 'acceleration', 'available']) {
    const value = graphics[key];
    if (typeof value === 'boolean') result[key] = value;
    else if (typeof value === 'string') result[key] = value.slice(0, 80);
  }
  return result;
}

function getReadingCapacity({ graphics, pdfBytes = 0 } = {}) {
  const total = Number.isFinite(os.totalmem()) ? os.totalmem() : 0;
  const free = Number.isFinite(os.freemem()) ? os.freemem() : 0;
  const cpuCount = typeof os.availableParallelism === 'function'
    ? os.availableParallelism()
    : os.cpus().length;
  const logicalCores = Math.max(1, Math.min(256, Number.isFinite(cpuCount) ? Math.floor(cpuCount) : 1));
  const cpuModel = String(os.cpus()[0]?.model || 'Unknown processor').slice(0, 120);
  const availableMiB = Math.max(0, Math.floor(free / MiB));
  const estimatedPdfMiB = Math.max(0, Math.min(1024, Math.floor((free - READING_MEMORY_RESERVE - MIN_RANGE_WORKING_BYTES) / 3 / MiB)));
  const memoryReadSlots = Math.floor(Math.max(0, free - READING_MEMORY_RESERVE) / (3 * WHOLE_FILE_TOOL_BYTES));
  // PDF.js reserves the complete source buffer even when native I/O is ranged.
  // Account for that before choosing an extra, temporary range assembly budget.
  // This remains a conservative estimate, not a promise about decoded page RAM.
  const sourceBytes = Number.isSafeInteger(pdfBytes) && pdfBytes > 0 ? pdfBytes : 0;
  const headroom = Math.max(0, free - readingMemoryRequired(sourceBytes));
  const rangeAssemblyMiB = headroom >= 1024 * MiB ? 256 : headroom >= 512 * MiB ? 128 : 64;
  const conservativeReading = headroom < 512 * MiB || logicalCores < 4 || /disabled|software/i.test(String(graphics?.status || ''));

  return {
    availableMiB,
    totalMiB: Math.max(0, Math.floor(total / MiB)),
    reserveMiB: READING_MEMORY_RESERVE / MiB,
    estimatedPdfMiB,
    wholeFileToolMiB: WHOLE_FILE_TOOL_BYTES / MiB,
    pageLimit: 500,
    rangeAssemblyMiB,
    rangeCacheMiB: conservativeReading ? 2 : 8,
    conservativeReading,
    concurrentReadLimit: Math.max(1, Math.min(4, logicalCores, memoryReadSlots || 1)),
    logicalCores,
    cpuModel,
    graphics: safeGraphicsStatus(graphics),
    estimateOnly: true,
    note: 'Estimate only: PDF complexity, graphics content, other applications, and current workload affect responsiveness.',
  };
}

module.exports = {
  MAX_READING_PDF_BYTES,
  READING_MEMORY_RESERVE,
  readingMemoryRequired,
  getReadingCapacity,
};
