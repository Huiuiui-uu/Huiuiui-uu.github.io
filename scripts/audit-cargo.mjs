import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';

const input = process.argv[2];
if (!input) {
  console.error('Usage: npm run audit:cargo -- https://your-cargo-site.com');
  process.exit(1);
}

const startUrl = new URL(input);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const queue = [startUrl.href];
const visited = new Set();
const pages = [];

while (queue.length && visited.size < 100) {
  const url = queue.shift();
  if (!url || visited.has(url)) continue;
  visited.add(url);

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45_000 });
    const record = await page.evaluate(() => ({
      url: location.href,
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
      headings: [...document.querySelectorAll('h1,h2,h3')].map((node) => node.textContent?.trim()).filter(Boolean),
      images: [...document.images].map((img) => ({
        src: img.currentSrc || img.src,
        alt: img.alt,
        width: img.naturalWidth,
        height: img.naturalHeight,
      })),
      stylesheets: [...document.querySelectorAll('link[rel="stylesheet"]')].map((link) => link.href),
      links: [...document.querySelectorAll('a[href]')].map((anchor) => anchor.href),
    }));

    pages.push(record);
    for (const href of record.links) {
      const linked = new URL(href, record.url);
      linked.hash = '';
      if (linked.origin === startUrl.origin && !visited.has(linked.href)) queue.push(linked.href);
    }

    console.log(`Audited ${record.url}`);
  } catch (error) {
    pages.push({ url, error: error instanceof Error ? error.message : String(error) });
    console.error(`Failed ${url}`);
  }
}

await writeFile('cargo-audit.json', JSON.stringify({ source: startUrl.href, pages }, null, 2));
await browser.close();
console.log(`Saved cargo-audit.json with ${pages.length} page records.`);
