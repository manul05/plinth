import type { ExportLine } from './event.js';

export function parseExport(_text: string): ExportLine[] {
  throw new Error('not implemented');
}

export function serializeExport(_lines: readonly ExportLine[]): string {
  throw new Error('not implemented');
}
