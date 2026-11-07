#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseURL = process.env.VISUAL_TEST_URL || 'http://127.0.0.1:4173/';
const outputDir = 'artifacts/visual';
await mkdir(outputDir, { recursive: true });

const viewports = [
  { name: 'mobile-375', width: 375, height: 812, mobile: true },
  { name: 'mobile-390', width: 390, height: 844, mobile: true },
  { name: 'mobile-430', width: 430, height: 932, mobile: true },
  { name: 'tablet-768', width: 768, height: 1024, mobile: false },
  { name: 'desktop-1440', width: 1440, height: 900, mobile: false }
];

const browser = await chromium.launch({ headless: true });
const report = {
  testedURL: baseURL,
  generatedAt: new Date().toISOString(),
  viewports: [],
  pageErrors: [],
  failedLocalRequests: []
};

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.mobile ? 2 : 1,
      isMobile: viewport.mobile,
      hasTouch: viewport.mobile
    });

    page.on('pageerror', error => report.pageErrors.push({ viewport: viewport.name, message: error.message }));
    page.on('requestfailed', request => {
      if (new URL(request.url()).origin === new URL(baseURL).origin) {
        report.failedLocalRequests.push({ viewport: viewport.name, url: request.url(), error: request.failure()?.errorText });
      }
    });

    const response = await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (!response?.ok()) throw new Error(`Page request failed for ${viewport.name}: HTTP ${response?.status()}`);
    await page.evaluate(() => document.fonts?.ready);
    await page.waitForTimeout(1600);

    const diagnostics = await page.evaluate(() => {
      const root = document.documentElement;
      const carousel = document.querySelector('#authorAchievements');
      const cards = carousel ? [...carousel.querySelectorAll('.about-achievements__card')] : [];
      const rect = element => {
        if (!element) return null;
        const r = element.getBoundingClientRect();
        return { left: Math.round(r.left * 10) / 10, right: Math.round(r.right * 10) / 10, width: Math.round(r.width * 10) / 10 };
      };
      return {
        viewportWidth: window.innerWidth,
        documentWidth: root.scrollWidth,
        horizontalOverflow: Math.max(0, root.scrollWidth - window.innerWidth),
        stylesheetCount: [...document.styleSheets].length,
        carousel: carousel ? {
          bounds: rect(carousel),
          parentBounds: rect(carousel.parentElement),
          parentOverflowX: getComputedStyle(carousel.parentElement).overflowX,
          clientWidth: carousel.clientWidth,
          scrollWidth: carousel.scrollWidth,
          cardCount: cards.length,
          firstCard: rect(cards[0]),
          lastCard: rect(cards.at(-1))
        } : null,
        brokenImages: [...document.images].filter(image => image.complete && image.naturalWidth === 0).map(image => image.currentSrc || image.src)
      };
    });

    await page.screenshot({ path: `${outputDir}/${viewport.name}-full.png`, fullPage: true, animations: 'disabled' });

    const section = page.locator('#about');
    if (await section.count()) {
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
      const achievements = page.locator('.about-achievements');
      if (await achievements.count()) {
        const box = await achievements.boundingBox();
        if (box) {
          const clipY = Math.max(0, Math.min(viewport.height - 1, box.y));
          const clipHeight = Math.max(1, Math.min(620, viewport.height - clipY));
          await page.screenshot({
            path: `${outputDir}/${viewport.name}-achievements.png`,
            clip: { x: 0, y: clipY, width: viewport.width, height: clipHeight },
            animations: 'disabled'
          });
        }
      }
    }

    report.viewports.push({ ...viewport, ...diagnostics });
    await page.close();
  }
} finally {
  await browser.close();
}

const overflowFailures = report.viewports.filter(item => item.horizontalOverflow > 1);
const runtimeFailures = report.pageErrors.length > 0 || report.failedLocalRequests.length > 0;
report.summary = {
  viewportCount: report.viewports.length,
  horizontalOverflowFailures: overflowFailures.map(item => ({ viewport: item.name, overflow: item.horizontalOverflow })),
  pageErrorCount: report.pageErrors.length,
  failedLocalRequestCount: report.failedLocalRequests.length
};
await writeFile(`${outputDir}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary, null, 2));

if (overflowFailures.length || runtimeFailures) {
  process.exitCode = 1;
}
