import sharp from 'sharp';

interface CoverOptions {
  title: string;
  description?: string;
  publishedAt?: Date;
}

/** Wrap text into lines of max `maxChars` characters */
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word.slice(0, maxChars);
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSvg(options: CoverOptions): string {
  const { title, description, publishedAt } = options;
  const titleLines = wrapText(title, 28);
  const titleStartY = 300;
  const lineHeight = 46;

  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<text x="297" y="${titleStartY + i * lineHeight}" font-size="38" font-weight="bold" fill="white" text-anchor="middle" font-family="Arial, Helvetica, sans-serif">${escapeXml(line)}</text>`
    )
    .join('\n');

  const descY = titleStartY + titleLines.length * lineHeight + 20;
  const descSvg =
    description
      ? `<text x="297" y="${descY}" font-size="16" fill="rgba(255,255,255,0.65)" text-anchor="middle" font-family="Arial, Helvetica, sans-serif">${escapeXml(description.slice(0, 72))}${description.length > 72 ? '…' : ''}</text>`
      : '';

  const dateStr = publishedAt
    ? publishedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : '';
  const dateSvg = dateStr
    ? `<text x="297" y="730" font-size="16" fill="#2dd4bf" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" letter-spacing="1">${escapeXml(dateStr)}</text>`
    : '';

  // Decorative grid lines
  const gridLines: string[] = [];
  for (let x = 0; x <= 595; x += 45) {
    gridLines.push(`<line x1="${x}" y1="0" x2="${x}" y2="842" stroke="rgba(255,255,255,0.025)" stroke-width="1"/>`);
  }
  for (let y = 0; y <= 842; y += 45) {
    gridLines.push(`<line x1="0" y1="${y}" x2="595" y2="${y}" stroke="rgba(255,255,255,0.025)" stroke-width="1"/>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="595" height="842" viewBox="0 0 595 842">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a3a5c;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#0f2540;stop-opacity:1"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#0d9488;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#0891b2;stop-opacity:1"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="595" height="842" fill="url(#bgGrad)"/>

  <!-- Grid texture -->
  ${gridLines.join('\n  ')}

  <!-- Decorative circles -->
  <circle cx="520" cy="110" r="160" fill="rgba(13,148,136,0.08)"/>
  <circle cx="75" cy="730" r="110" fill="rgba(13,148,136,0.06)"/>

  <!-- Top accent bar -->
  <rect x="0" y="0" width="595" height="5" fill="url(#accentGrad)"/>

  <!-- PVPA branding label -->
  <text x="297" y="165" font-size="13" letter-spacing="5" fill="#2dd4bf" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="600">PVPA DIGITAL LIBRARY</text>

  <!-- Divider line -->
  <rect x="120" y="185" width="355" height="2" fill="url(#accentGrad)" rx="1"/>

  <!-- Title lines -->
  ${titleSvg}

  <!-- Description -->
  ${descSvg}

  <!-- Date -->
  ${dateSvg}

  <!-- Bottom footer band -->
  <rect x="0" y="800" width="595" height="42" fill="rgba(13,148,136,0.18)"/>
  <text x="297" y="826" font-size="11" fill="rgba(255,255,255,0.5)" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" letter-spacing="3">PVPA PUBLICATIONS</text>

  <!-- Bottom accent bar -->
  <rect x="0" y="837" width="595" height="5" fill="url(#accentGrad)"/>
</svg>`;
}

export async function generateCover(options: CoverOptions): Promise<Buffer> {
  const svg = buildSvg(options);
  const svgBuffer = Buffer.from(svg, 'utf-8');

  try {
    return await sharp(svgBuffer).jpeg({ quality: 92 }).toBuffer();
  } catch {
    // Fallback: plain coloured rectangle if SVG rasterisation is unavailable
    return await sharp({
      create: {
        width: 595,
        height: 842,
        channels: 3,
        background: { r: 26, g: 58, b: 92 },
      },
    })
      .jpeg({ quality: 92 })
      .toBuffer();
  }
}
