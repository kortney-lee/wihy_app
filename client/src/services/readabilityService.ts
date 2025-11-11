// @ts-ignore
const TextStatistics = require('text-statistics');

export function getReadability(text: string): number {
  const ts = new TextStatistics(text);
  return ts.fleschKincaidReadingEase();
}