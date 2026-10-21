/* global document, window, localStorage, requestAnimationFrame */
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import process from 'node:process';
import { URL } from 'node:url';

// Install Playwright locally, or provide it through NODE_PATH. No runtime dependency is added.
const { chromium } = createRequire(import.meta.url)('playwright');
const base = process.env.BASE_URL || process.argv[2] || 'http://localhost:4173/';
const output = resolve(process.env.OUTPUT_DIR || process.argv[3] || 'shots');
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}),
});
const failures = [];
const browserConsole = [];
const externalRequests = new Set();
const screenshots = [];
const scenarios = [];
const baseOrigin = new URL(base).origin;
const css = ':root {\n  --color-brand: #10b981;\n  --space-md: 16px;\n  --radius-card: 24px;\n}';
const batch = [
  { name: 'theme.css', mimeType: 'text/css', buffer: Buffer.from(css) },
  {
    name: 'tokens.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"color":{"accent":{"$type":"color","$value":"#f59e0b"}}}'),
  },
  {
    name: 'palette.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="#2563eb"/><image href="https://source-resource.invalid/pixel.png"/></svg>'
    ),
  },
  {
    name: 'page.html',
    mimeType: 'text/html',
    buffer: Buffer.from(
      '<link rel="stylesheet" href="https://source-resource.invalid/style.css"><div style="color:#e11d48;padding:8px">Design notes</div>'
    ),
  },
];

function record(message) {
  scenarios.push(message);
  process.stdout.write(`PASS ${message}\n`);
}

async function settled(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(
    () => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame)))
  );
}

async function open(theme = 'dark', width = 1440) {
  const context = await browser.newContext({
    viewport: { width, height: width < 768 ? 844 : 900 },
    deviceScaleFactor: 2,
    colorScheme: theme,
    reducedMotion: 'reduce',
    locale: 'en-US',
    timezoneId: 'UTC',
    acceptDownloads: true,
  });
  await context.addInitScript(selectedTheme => localStorage.setItem('dmve-theme', selectedTheme), theme);
  const page = await context.newPage();
  page.on('pageerror', error => failures.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') browserConsole.push(message.text());
  });
  page.on('request', request => {
    const url = new URL(request.url());
    if (
      /^https?:$/.test(url.protocol) &&
      url.origin !== baseOrigin &&
      !['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)
    )
      externalRequests.add(request.url());
  });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: /Design.md Visual Explorer/ }).waitFor();
  await settled(page);
  return { page, context };
}

async function capture(page, name, locator) {
  await settled(page);
  await (locator || page).screenshot({ path: resolve(output, `${name}.png`) });
  screenshots.push(name);
}

async function loaded(page) {
  try {
    await page.getByRole('region', { name: 'Import summary' }).waitFor({ timeout: 35000 });
  } catch (error) {
    process.stderr.write(
      `Import diagnostics: ${JSON.stringify({ alerts: await page.getByRole('alert').allTextContents(), errors: failures, console: browserConsole })}\n`
    );
    throw error;
  }
  await page.locator('main h1').waitFor({ timeout: 15000 });
  await settled(page);
}

async function navigate(page, name) {
  const sidebar = page.getByRole('navigation', { name: 'Design system categories' });
  if (!(await sidebar.isVisible())) await page.getByRole('button', { name: /^Category:/ }).click();
  await sidebar.getByRole('button', { name: new RegExp(`^${name}(?:\\s|$)`) }).click();
  await page.locator('main h1').waitFor();
  await settled(page);
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function reset(page) {
  await page.getByRole('button', { name: 'Import other sources' }).click();
  await page.getByRole('heading', { name: /Design.md Visual Explorer/ }).waitFor();
}

async function importFiles(page, files) {
  await page.locator('input[type="file"]').setInputFiles(files);
  await loaded(page);
}

async function pasteCss(page, content, name) {
  await page.getByLabel('Content format', { exact: true }).selectOption('css');
  await page.getByLabel('Source name', { exact: false }).fill(name);
  await page.getByLabel('Source content', { exact: true }).fill(content);
  await page.getByRole('button', { name: 'Generate DESIGN.md', exact: true }).click();
  await loaded(page);
}

async function checkOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({
    actual: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  assert.ok(dimensions.actual <= dimensions.viewport, `${label}: ${JSON.stringify(dimensions)}`);
}

function textPdf() {
  const stream = 'BT /F1 18 Tf 50 720 Td (Brand color #10b981 and space 16px) Tj ET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return { name: 'brand-guide.pdf', mimeType: 'application/pdf', buffer: Buffer.from(pdf) };
}

try {
  await mkdir(output, { recursive: true });
  for (const theme of ['dark', 'light']) {
    const { page, context } = await open(theme);
    await capture(page, `landing-${theme}`);
    await page.getByRole('button', { name: /Extracted Site System/ }).click();
    await loaded(page);
    await capture(page, `overview-${theme}`);
    const profile = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Design System Profile', exact: true }) });
    await capture(page, `radar-${theme}`, profile);
    await navigate(page, 'Colors');
    await page.getByRole('heading', { name: 'Color Palette & Vision Simulator' }).waitFor();
    await capture(page, `colors-${theme}`);
    await navigate(page, 'Health Audit');
    await page.getByRole('heading', { name: 'Design System Health & Linter Audit' }).waitFor();
    await capture(page, `audit-${theme}`);
    await navigate(page, 'Source');
    await page.getByRole('heading', { name: 'Source design.md Inspector' }).waitFor();
    await capture(page, `source-${theme}`);
    record(`${theme} demo, lazy views, and original screenshot paths`);
    await context.close();
  }

  const { page, context } = await open();
  await page.getByRole('button', { name: 'Generate DESIGN.md', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Paste some source content' }).waitFor();
  record('empty paste validation');

  for (const [name, content] of [
    ['theme.css', css],
    ['minified.css', ':root{--color-brand:#10b981;--space-md:16px;--radius-card:24px}'],
  ]) {
    await pasteCss(page, content, name);
    await navigate(page, 'Colors');
    assert.match((await page.locator('main').innerText()).toLowerCase(), /#10b981/);
    await navigate(page, 'Spacing');
    await page.getByRole('heading', { name: 'Spacing Scale & Rhythm' }).waitFor();
    assert.match(await page.locator('main').innerText(), /16px/);
    record(`${name} paste extracts actual color and spacing`);
    await reset(page);
  }

  await importFiles(page, batch);
  const summary = page.getByRole('region', { name: 'Import summary' });
  await summary.locator('details').first().locator('summary').click();
  for (const file of batch) assert.ok((await summary.innerText()).includes(file.name));
  await summary.locator('details').last().locator('summary').click();
  assert.match(await summary.innerText(), /not rendered|not fetched|not.*rendered/i);
  await capture(page, 'import-batch');
  record('CSS + DTCG JSON + SVG + HTML batch retains every source and static-resource notes');

  await page.keyboard.press('Control+k');
  const search = page.getByRole('dialog', { name: 'Search the design system' });
  await search.waitFor();
  await search.getByRole('textbox').fill('brand');
  await search.getByText('brand', { exact: true }).first().waitFor();
  await page.keyboard.press('Escape');
  await navigate(page, 'Colors');
  await page.getByRole('button', { name: 'View source in design.md', exact: true }).first().click();
  await page.getByRole('button', { name: 'Jump to source →', exact: true }).click();
  await page.getByRole('heading', { name: 'Source design.md Inspector' }).waitFor();
  assert.ok(await page.locator('[data-source-line].ring-1').count());
  record('Ctrl+K search and token source navigation');

  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await page.getByRole('button', { name: 'Normalized DESIGN.md', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download File', exact: true }).click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), 'DESIGN.md');
  const downloadStream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of downloadStream) chunks.push(chunk);
  const exported = Buffer.concat(chunks).toString('utf8');
  assert.ok(exported.length > 100);
  assert.match(exported, /#10b981/i);
  await page.getByRole('button', { name: 'Close export dialog' }).click();
  record('normalized DESIGN.md download filename and nonempty token content');
  await reset(page);

  await importFiles(page, [
    batch[0],
    { name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{broken') },
  ]);
  await page
    .getByRole('region', { name: 'Import summary' })
    .getByText(/import note/)
    .click();
  assert.match(await page.locator('main').innerText(), /broken.json: Invalid JSON/);
  record('malformed JSON with valid CSS loads and retains a partial-import warning');
  await reset(page);
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: 'archive.zip', mimeType: 'application/zip', buffer: Buffer.from('unsupported') });
  await page.getByRole('alert').filter({ hasText: 'No sources could be imported' }).waitFor();
  await page.getByRole('heading', { name: /Design.md Visual Explorer/ }).waitFor();
  record('all-invalid batch stays on usable landing');

  const rasters = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const drawing = canvas.getContext('2d');
    drawing.fillStyle = '#10b981';
    drawing.fillRect(0, 0, 32, 32);
    drawing.fillStyle = '#0b0f0c';
    drawing.fillRect(16, 0, 16, 32);
    return ['png', 'jpeg', 'webp'].map(format => ({
      format,
      data: canvas.toDataURL(`image/${format}`).split(',')[1],
    }));
  });
  for (const raster of rasters) {
    await importFiles(page, {
      name: `palette.${raster.format}`,
      mimeType: `image/${raster.format}`,
      buffer: Buffer.from(raster.data, 'base64'),
    });
    assert.match(
      await page.getByRole('region', { name: 'Import summary' }).innerText(),
      /Images provide palettes only/
    );
    await navigate(page, 'Colors');
    await page.getByRole('heading', { name: 'Color Palette & Vision Simulator' }).waitFor();
    assert.match(await page.locator('main').innerText(), /Sample 1/);
    record(`real ${raster.format.toUpperCase()} browser decode and palette-only limitation`);
    await reset(page);
  }
  await importFiles(page, textPdf());
  const pdfSummary = page.getByRole('region', { name: 'Import summary' });
  assert.match(await pdfSummary.innerText(), /PDF text/);
  await pdfSummary.getByText(/import note/).click();
  assert.match(await pdfSummary.innerText(), /embedded text only/);
  await navigate(page, 'Source');
  assert.match(await page.locator('main').innerText(), /Brand color #10b981 and space 16px/);
  record('real PDF.js module worker extracts embedded PDF text with visible limitations');
  await context.close();

  for (const [width, theme] of [
    [375, 'dark'],
    [390, 'light'],
  ]) {
    const mobile = await open(theme, width);
    await checkOverflow(mobile.page, `${width}px ${theme} landing`);
    await importFiles(mobile.page, batch);
    await checkOverflow(mobile.page, `${width}px ${theme} loaded`);
    await navigate(mobile.page, 'Colors');
    await mobile.page.getByRole('heading', { name: 'Color Palette & Vision Simulator' }).waitFor();
    await checkOverflow(mobile.page, `${width}px ${theme} colors`);
    if (width === 390) await capture(mobile.page, 'import-mobile');
    record(`${width}px ${theme} landing, loaded sidebar, and colors without page overflow`);
    await mobile.context.close();
  }

  assert.deepEqual(failures, [], 'Uncaught browser errors');
  assert.deepEqual(browserConsole, [], 'Browser console errors');
  assert.deepEqual([...externalRequests], [], 'Unexpected external requests');
  process.stdout.write(
    `PASS ${scenarios.length} browser scenarios; ${screenshots.length} screenshots; no uncaught errors or unexpected external requests\n`
  );
  process.stdout.write(`Screenshots: ${output}\n`);
} finally {
  await browser.close();
}
