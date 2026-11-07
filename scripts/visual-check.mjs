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
    await page.waitForTimeout(500);

    // Прокручиваем страницу через все секции, чтобы IntersectionObserver
    // успел добавить is-visible элементам с motion-reveal до fullPage-снимка.
    const revealSweep = await page.evaluate(async () => {
      const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
      const step = Math.max(320, Math.floor(window.innerHeight * 0.7));
      let previousHeight = 0;
      for (let pass = 0; pass < 3; pass++) {
        const height = document.documentElement.scrollHeight;
        for (let y = 0; y < height; y += step) {
          window.scrollTo(0, y);
          await pause(90);
        }
        window.scrollTo(0, document.documentElement.scrollHeight);
        await pause(250);
        const currentHeight = document.documentElement.scrollHeight;
        if (currentHeight === previousHeight) break;
        previousHeight = currentHeight;
      }
      await pause(350);
      window.scrollTo(0, 0);
      await pause(250);
      const motionElements = [...document.querySelectorAll('.motion-reveal')];
      return {
        targetCount: motionElements.length,
        unrevealedCount: motionElements.filter(el => !el.classList.contains('is-visible')).length,
        unrevealed: motionElements
          .filter(el => !el.classList.contains('is-visible'))
          .slice(0, 20)
          .map(el => ({
            tag: el.tagName.toLowerCase(),
            className: typeof el.className === 'string' ? el.className : '',
            text: (el.innerText || '').trim().slice(0, 100)
          }))
      };
    });

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

    report.viewports.push({ ...viewport, ...diagnostics, revealSweep });
    await page.close();
  }
} finally {
  await browser.close();
}

const overflowFailures = report.viewports.filter(item => item.horizontalOverflow > 1);
const carouselGeometryFailures = report.viewports.filter(item =>
  item.mobile && (
    !item.carousel ||
    Math.abs(item.carousel.bounds.left) > 1 ||
    Math.abs(item.carousel.bounds.width - item.viewportWidth) > 1 ||
    item.carousel.parentOverflowX !== 'visible'
  )
);
const brokenImageFailures = report.viewports.filter(item => item.brokenImages.length > 0);
const revealFailures = report.viewports.filter(item => item.revealSweep?.unrevealedCount > 0);
const runtimeFailures = report.pageErrors.length > 0 || report.failedLocalRequests.length > 0;
report.summary = {
  viewportCount: report.viewports.length,
  horizontalOverflowFailures: overflowFailures.map(item => ({ viewport: item.name, overflow: item.horizontalOverflow })),
  carouselGeometryFailures: carouselGeometryFailures.map(item => ({
    viewport: item.name,
    carousel: item.carousel,
    viewportWidth: item.viewportWidth
  })),
  brokenImageFailures: brokenImageFailures.map(item => ({ viewport: item.name, images: item.brokenImages })),
  revealFailures: revealFailures.map(item => ({ viewport: item.name, revealSweep: item.revealSweep })),
  pageErrorCount: report.pageErrors.length,
  failedLocalRequestCount: report.failedLocalRequests.length
};
await writeFile(`${outputDir}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary, null, 2));

if (overflowFailures.length || carouselGeometryFailures.length || brokenImageFailures.length || revealFailures.length || runtimeFailures) {
  process.exitCode = 1;
}
