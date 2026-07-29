import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_URL = 'https://regle-enligne.onl';
const INDEXNOW_KEY = '66a8eaa41055fd74aecd440735d9f84c';
const INDEXNOW_ENDPOINT =
  process.env.INDEXNOW_ENDPOINT || 'https://api.indexnow.org/indexnow';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');
const keyFilename = `${INDEXNOW_KEY}.txt`;
const keyLocation = new URL(`/${keyFilename}`, SITE_URL).href;
const siteHost = new URL(SITE_URL).host;
const dryRun = process.argv.includes('--dry-run');

async function getHtmlFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return getHtmlFiles(entryPath);
      }

      if (entry.isFile() && entry.name.endsWith('.html')) {
        return [entryPath];
      }

      return [];
    }),
  );

  return files.flat();
}

function htmlFileToRoute(filePath) {
  const relativePath = path.relative(distDir, filePath).split(path.sep).join('/');

  if (relativePath === 'index.html') {
    return '/';
  }

  if (relativePath.endsWith('/index.html')) {
    return `/${relativePath.slice(0, -'index.html'.length)}`;
  }

  return `/${relativePath.replace(/\.html$/, '/')}`;
}

function hasNoIndexDirective(html) {
  const metaTags = html.match(/<meta\b[^>]*>/gi) || [];

  return metaTags.some((tag) => {
    if (!/\bname\s*=\s*["']robots["']/i.test(tag)) {
      return false;
    }

    const content = tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i)?.[1] || '';
    return content
      .toLowerCase()
      .split(/[,\s]+/)
      .includes('noindex');
  });
}

async function assertKeyFile() {
  try {
    await fs.access(distDir);
  } catch {
    throw new Error('dist/ was not found. Run npm run build before submitting to IndexNow.');
  }

  const distKeyPath = path.join(distDir, keyFilename);
  let keyContent;

  try {
    keyContent = (await fs.readFile(distKeyPath, 'utf8')).trim();
  } catch {
    throw new Error(
      `${distKeyPath} was not found. Run npm run build and deploy the generated key file first.`,
    );
  }

  if (keyContent !== INDEXNOW_KEY) {
    throw new Error(`${distKeyPath} does not contain the configured IndexNow key.`);
  }
}

async function collectIndexableUrls() {
  const htmlFiles = await getHtmlFiles(distDir);
  const urls = [];

  for (const file of htmlFiles) {
    const route = htmlFileToRoute(file);

    if (route === '/404/' || route === '/404.html') {
      continue;
    }

    const html = await fs.readFile(file, 'utf8');

    if (hasNoIndexDirective(html)) {
      continue;
    }

    urls.push(new URL(route, SITE_URL).href);
  }

  return [...new Set(urls)].sort((a, b) => a.localeCompare(b));
}

async function submitBatch(urlList, batchNumber, batchCount) {
  const payload = {
    host: siteHost,
    key: INDEXNOW_KEY,
    keyLocation,
    urlList,
  };

  if (dryRun) {
    console.log(`Dry run: batch ${batchNumber}/${batchCount}`);
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(payload),
  });
  const responseBody = await response.text();

  if (![200, 202].includes(response.status)) {
    throw new Error(
      `IndexNow submission failed (${response.status} ${response.statusText}): ${responseBody}`,
    );
  }

  console.log(
    `Submitted batch ${batchNumber}/${batchCount}: ${response.status} ${response.statusText}`,
  );
}

async function main() {
  await assertKeyFile();

  const urls = await collectIndexableUrls();

  if (urls.length === 0) {
    throw new Error('No indexable HTML URLs were found in dist/. Run npm run build first.');
  }

  const batches = [];

  for (let index = 0; index < urls.length; index += 10000) {
    batches.push(urls.slice(index, index + 10000));
  }

  console.log(`Found ${urls.length} indexable URL(s).`);

  for (const [index, batch] of batches.entries()) {
    await submitBatch(batch, index + 1, batches.length);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
