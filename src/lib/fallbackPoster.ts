import { shortLabel } from './gameHelpers';

const escapeSvgText = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;');

const buildWrappedLines = (rawName: string) => {
  const normalized = (rawName.trim() || 'Unknown game').replace(/\s+/g, ' ');
  const words = normalized.split(' ');
  const maxCharsPerLine = 12;
  const maxLines = 3;
  const tokens: string[] = [];
  const lines: string[] = [];
  let wasTruncated = false;

  for (const word of words) {
    if (word.length <= maxCharsPerLine) {
      tokens.push(word);
      continue;
    }

    let remaining = word;
    while (remaining.length > maxCharsPerLine) {
      tokens.push(`${remaining.slice(0, maxCharsPerLine - 1)}-`);
      remaining = remaining.slice(maxCharsPerLine - 1);
    }

    if (remaining.length) {
      tokens.push(remaining);
    }
  }

  for (const token of tokens) {
    if (!lines.length) {
      lines.push(token);
      continue;
    }

    const lastIndex = lines.length - 1;
    const candidate = `${lines[lastIndex]} ${token}`;

    if (candidate.length <= maxCharsPerLine) {
      lines[lastIndex] = candidate;
      continue;
    }

    if (lines.length < maxLines) {
      lines.push(token);
      continue;
    }

    wasTruncated = true;
    break;
  }

  let compact = lines
    .map((line) => shortLabel(line, maxCharsPerLine))
    .filter((line) => line.length > 0);

  if (!compact.length) {
    return ['Unknown game'];
  }

  if (wasTruncated) {
    const lastIndex = compact.length - 1;
    compact = compact.map((line, index) => {
      if (index !== lastIndex) return line;
      return `${shortLabel(line, maxCharsPerLine - 1).replace(/\.\.\.$/, '')}...`;
    });
  }

  return compact;
};

export const createFallbackPoster = (gameName: string) => {
  const lines = buildWrappedLines(gameName);
  const fontSize = lines.length >= 3 ? 21 : lines.length === 2 ? 26 : 33;
  const lineHeight = lines.length >= 3 ? 27 : lines.length === 2 ? 31 : 36;
  const startDy = -((lines.length - 1) * lineHeight) / 2;
  const safeLines = lines.map((line) => escapeSvgText(line));

  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='440' height='520' viewBox='0 0 440 520'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0' stop-color='#163e63'/>
          <stop offset='1' stop-color='#0f172a'/>
        </linearGradient>
      </defs>
      <rect width='440' height='520' fill='url(#g)'/>
      <text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle' font-family='Outfit, sans-serif' font-size='${fontSize}' fill='#dbeafe'>
        ${safeLines.map((line, index) => `<tspan x='50%' dy='${index === 0 ? startDy : lineHeight}'>${line}</tspan>`).join('')}
      </text>
    </svg>`,
  )}`;
};
