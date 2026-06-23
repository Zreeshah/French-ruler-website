import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '../../blog-posts');
const destDir = path.join(__dirname, '../content/blog');
const blogImgDir = path.join(__dirname, '../../public/images/blog');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}
if (!fs.existsSync(blogImgDir)) {
  fs.mkdirSync(blogImgDir, { recursive: true });
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateSVG(title) {
  // Let's generate the ticks for a technical ruler look
  let ticks = '';
  for (let x = 50; x <= 1150; x += 10) {
    let height = 15;
    if ((x - 50) % 100 === 0) {
      height = 35;
      ticks += `<text x="${x}" y="55" fill="rgba(255,255,255,0.4)" font-family="system-ui, sans-serif" font-size="14" font-weight="600" text-anchor="middle">${(x - 50) / 10}</text>\n`;
    } else if ((x - 50) % 50 === 0) {
      height = 25;
    }
    ticks += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />\n`;
  }
  
  // Word wrap for title to fit SVG container nicely
  const words = title.split(' ');
  let lines = [];
  let currentLine = '';
  for (let word of words) {
    if ((currentLine + ' ' + word).length > 28) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? currentLine + ' ' + word : word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  
  let textY = 270 - (lines.length * 20);
  let titleText = lines.map((line, idx) => {
    return `<text x="100" y="${textY + (idx * 65)}" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="800" letter-spacing="-1px">${escapeHtml(line)}</text>`;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0F172A;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#1E3A8A;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#2563EB;stop-opacity:1" />
      </linearGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
      </pattern>
    </defs>
    
    <!-- Background -->
    <rect width="100%" height="100%" fill="url(#grad)" />
    <!-- Grid Overlay -->
    <rect width="100%" height="100%" fill="url(#grid)" />
    
    <!-- Top Ruler ticks -->
    <g>
      <line x1="0" y1="0" x2="1200" y2="0" stroke="rgba(255,255,255,0.3)" stroke-width="3" />
      ${ticks}
    </g>
    
    <!-- Glowing Accent bar on the left -->
    <rect x="50" y="160" width="8" height="260" rx="4" fill="#3B82F6" opacity="0.8" style="filter: drop-shadow(0px 0px 8px #3B82F6);" />
    
    <!-- Label/Category -->
    <rect x="100" y="110" width="180" height="34" rx="17" fill="rgba(59, 130, 246, 0.15)" stroke="rgba(59, 130, 246, 0.35)" stroke-width="1.5" />
    <text x="190" y="132" fill="#60A5FA" font-family="system-ui, sans-serif" font-size="12" font-weight="700" letter-spacing="1px" text-anchor="middle">GUIDE DE MESURE</text>
    
    <!-- Title -->
    <g>
      ${titleText}
    </g>
    
    <!-- Site Brand -->
    <text x="100" y="520" fill="rgba(255,255,255,0.35)" font-family="system-ui, sans-serif" font-size="18" font-weight="600" letter-spacing="0.5px">regle-enligne.onl — Règle en ligne 1:1</text>
  </svg>`;
}

const files = fs.readdirSync(srcDir);

files.forEach(file => {
  if (!file.endsWith('.md')) return;
  const filePath = path.join(srcDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');

  // Parse metadata
  const lines = content.split('\n');
  let seoTitle = '';
  let slug = '';
  let metaDesc = '';
  let ogTitle = '';
  let ogDesc = '';
  let imgAlt = '';
  
  let articleStartIndex = -1;
  let schemaStartIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '## SEO Title') {
      seoTitle = lines[i+1]?.trim() || '';
    } else if (line === '## URL Slug') {
      slug = lines[i+1]?.trim() || '';
    } else if (line === '## Meta Description') {
      metaDesc = lines[i+1]?.trim() || '';
    } else if (line === '## Open Graph Title') {
      ogTitle = lines[i+1]?.trim() || '';
    } else if (line === '## Open Graph Description') {
      ogDesc = lines[i+1]?.trim() || '';
    } else if (line === '## Suggested Image Alt Text') {
      imgAlt = lines[i+1]?.trim() || '';
    } else if (line === '## Article') {
      articleStartIndex = i + 1;
    } else if (line === '## Article Schema JSON-LD') {
      schemaStartIndex = i;
      break;
    }
  }

  if (articleStartIndex === -1) {
    console.error(`Article section not found in ${file}`);
    return;
  }

  let articleBodyLines = lines.slice(articleStartIndex, schemaStartIndex !== -1 ? schemaStartIndex : lines.length);
  let articleBody = articleBodyLines.join('\n').trim();

  // Determine Image path
  const pngPath = path.join(blogImgDir, `${slug}.png`);
  let heroImage = '';
  
  if (fs.existsSync(pngPath)) {
    heroImage = `/images/blog/${slug}.png`;
  } else {
    // Generate custom SVG
    const svgCode = generateSVG(seoTitle);
    const svgFilename = `${slug}.svg`;
    fs.writeFileSync(path.join(blogImgDir, svgFilename), svgCode, 'utf-8');
    heroImage = `/images/blog/${svgFilename}`;
  }

  // Create frontmatter
  const frontmatter = [
    '---',
    `title: ${JSON.stringify(seoTitle)}`,
    `description: ${JSON.stringify(metaDesc)}`,
    `ogTitle: ${JSON.stringify(ogTitle)}`,
    `ogDescription: ${JSON.stringify(ogDesc)}`,
    `imageAlt: ${JSON.stringify(imgAlt)}`,
    `heroImage: ${JSON.stringify(heroImage)}`,
    `pubDate: "2026-06-07"`,
    '---',
    '',
    articleBody
  ].join('\n');

  const destFile = path.join(destDir, `${slug}.md`);
  fs.writeFileSync(destFile, frontmatter, 'utf-8');
  console.log(`Processed ${file} -> ${slug}.md (Image: ${heroImage})`);
});
