/**
 * צילומי מסך אוטומטיים של כל עמודי האפליקציה בשני גדלי מסך + איסוף שגיאות קונסולה.
 *
 * הרצה:
 *   1. VITE_E2E=1 bun run dev   (טרמינל אחד — עוקף auth בפיתוח בלבד)
 *   2. bunx tsx scripts/e2e-screenshots.ts [output-dir]
 *
 * דורש PLAYWRIGHT_BROWSERS_PATH מוגדר (או chromium מותקן).
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { buildSeedSnapshots } from './e2e-seed-deals';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:8080';
const OUT = process.argv[2] ?? 'screenshots';
const SEED_JSON = JSON.stringify(buildSeedSnapshots());

const ROUTES = [
  { path: '/login', name: 'login' },
  { path: '/', name: 'budget' },
  { path: '/business-plan', name: 'business-plan' },
  { path: '/mortgage', name: 'mortgage' },
  { path: '/property-check', name: 'property-check' },
  { path: '/deal-comparison', name: 'deal-comparison' },
  { path: '/chat', name: 'chat' },
  { path: '/account', name: 'account' },
  { path: '/guide', name: 'guide' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
];

async function main() {
  mkdirSync(OUT, { recursive: true });
  // בסביבות עם דפדפן מותקן מראש (PLAYWRIGHT_BROWSERS_PATH) ייתכן פער גרסאות —
  // symlink יציב ב-/opt/pw-browsers/chromium עוקף את זה
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium',
  });
  const errors: Record<string, string[]> = {};

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      serviceWorkers: 'block',
    });
    // עסקאות דמו למצב E2E — snapshots.ts קורא אותן מ-localStorage
    await context.addInitScript((seed: string) => {
      window.localStorage.setItem('e2e_snapshots', seed);
    }, SEED_JSON);
    const page = await context.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        (errors[`${vp.name}`] ??= []).push(msg.text().slice(0, 300));
      }
    });
    page.on('pageerror', (err) => {
      (errors[`${vp.name}`] ??= []).push(`PAGEERROR: ${String(err).slice(0, 300)}`);
    });

    for (const route of ROUTES) {
      await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle' }).catch(async () => {
        await page.goto(`${BASE}${route.path}`, { waitUntil: 'load' });
      });
      await page.waitForTimeout(900); // אנימציות כניסה
      await page.screenshot({ path: `${OUT}/${route.name}-${vp.name}.png`, fullPage: true });
      console.log(`✓ ${route.name} (${vp.name})`);

      // בעמוד ההשוואה — צילום גם של טאבי מול-מול וגרפים
      if (route.path === '/deal-comparison') {
        for (const tab of [
          { label: 'מול-מול', name: 'deal-side-by-side' },
          { label: 'גרפים', name: 'deal-charts' },
        ]) {
          const trigger = page.getByRole('tab', { name: tab.label });
          if (await trigger.count()) {
            await trigger.first().click();
            await page.waitForTimeout(700);
            await page.screenshot({ path: `${OUT}/${tab.name}-${vp.name}.png`, fullPage: true });
            console.log(`✓ ${tab.name} (${vp.name})`);
          }
        }
      }
    }
    await context.close();
  }

  await browser.close();

  const total = Object.values(errors).flat();
  if (total.length) {
    console.log('\n--- Console errors ---');
    for (const [vp, list] of Object.entries(errors)) {
      for (const e of [...new Set(list)]) console.log(`[${vp}] ${e}`);
    }
    process.exitCode = 1;
  } else {
    console.log('\nאין שגיאות קונסולה ✓');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
