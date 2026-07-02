import puppeteer from "puppeteer";
import type { Browser, Page } from "puppeteer";
import { logger } from "../lib/logger";

// ── Stealth: injected into every new page to hide automation fingerprints ─
const STEALTH_SCRIPT = `
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  window.chrome = { runtime: {} };
  Object.defineProperty(navigator, 'plugins', { get: () => [1,2,3,4,5] });
  Object.defineProperty(navigator, 'languages', { get: () => ['en-US','en'] });
  const origUA = navigator.userAgent;
  Object.defineProperty(navigator, 'userAgent', {
    get: () => origUA.replace('HeadlessChrome', 'Chrome')
  });
`;

interface SessionData { browser: Browser; page: Page; }
const activeSessions = new Map<number, SessionData>();

function randomStr(len: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
function generateAppTitle(): string {
  const adj  = ["Swift","Prime","Nova","Apex","Core","Star","Flex","Wave","Bolt","Edge"];
  const noun = ["App","Hub","Link","Net","Box","Lab","Zone","Pro","Kit","Sync"];
  return adj[Math.floor(Math.random()*adj.length)]! + noun[Math.floor(Math.random()*noun.length)]!;
}
function generateShortName(): string {
  return randomStr(6) + Math.floor(Math.random()*9999).toString().padStart(4,"0");
}

async function closeSession(userId: number): Promise<void> {
  const s = activeSessions.get(userId);
  if (s) { try { await s.browser.close(); } catch { /* ignore */ } activeSessions.delete(userId); }
}

export async function cancelTgSession(userId: number): Promise<void> {
  await closeSession(userId);
}

/** Clear, focus, and type into a field — works on React/Vue controlled inputs too */
async function fillField(page: Page, selector: string, value: string): Promise<void> {
  await page.focus(selector);
  await page.keyboard.down("Control");
  await page.keyboard.press("a");
  await page.keyboard.up("Control");
  await page.keyboard.press("Backspace");
  await new Promise(r => setTimeout(r, 100));
  await page.type(selector, value, { delay: 80 + Math.random() * 60 });
}

/** Try multiple selectors, return the first one found */
async function waitForAny(page: Page, selectors: string[], timeout = 20000): Promise<string | null> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    for (const sel of selectors) {
      const el = await page.$(sel);
      if (el) return sel;
    }
    await new Promise(r => setTimeout(r, 300));
  }
  return null;
}

export async function startPhoneLogin(userId: number, phoneNumber: string): Promise<"ok" | "error"> {
  try {
    await closeSession(userId);

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox", "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", "--disable-gpu",
        "--no-first-run", "--no-zygote",
        "--window-size=1280,800",
        "--disable-blink-features=AutomationControlled",
      ],
    });

    const page = await browser.newPage();
    await page.evaluateOnNewDocument(STEALTH_SCRIPT);
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.155 Safari/537.36",
    );
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
    activeSessions.set(userId, { browser, page });

    await page.goto("https://my.telegram.org/auth", { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    // ── Find phone input — my.telegram.org uses id="my_tel", fallback to name/type ──
    const phoneSelectors = ['input#my_tel', 'input[name="phone"]', 'input[type="tel"]'];
    const phoneSel = await waitForAny(page, phoneSelectors, 20000);
    if (!phoneSel) {
      const url = page.url();
      const body = await page.$eval("body", el => (el as HTMLElement).innerText).catch(() => "");
      logger.error({ userId, url, body: body.slice(0, 400) }, "startPhoneLogin: phone field not found");
      await closeSession(userId);
      return "error";
    }
    logger.info({ userId, phoneSel }, "startPhoneLogin: phone field found");

    await fillField(page, phoneSel, phoneNumber);
    await new Promise(r => setTimeout(r, 800 + Math.random() * 400));

    // ── Submit: try button click then keyboard Enter as fallback ──────────────
    const btnClicked = await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>('button[type="submit"]');
      if (btn && !btn.disabled) { btn.click(); return true; }
      return false;
    });
    if (!btnClicked) {
      // Fallback: press Enter in the phone field
      await page.focus(phoneSel);
      await page.keyboard.press("Enter");
    }
    logger.info({ userId, btnClicked }, "startPhoneLogin: submitted phone form");

    // ── Wait for code input (Telegram uses id="my_password" / name="password") ─
    const codeSelectors = ['input#my_password', 'input[name="password"]'];
    const codeSel = await waitForAny(page, codeSelectors, 25000);
    if (!codeSel) {
      const url  = page.url();
      const body = await page.$eval("body", el => (el as HTMLElement).innerText).catch(() => "");
      logger.error({ userId, url, body: body.slice(0, 400) }, "startPhoneLogin: code field not found after submit");
      await closeSession(userId);
      return "error";
    }

    logger.info({ userId, codeSel }, "startPhoneLogin: code field appeared ✓");
    return "ok";
  } catch (err) {
    logger.error({ err, userId }, "startPhoneLogin error");
    await closeSession(userId);
    return "error";
  }
}

export async function submitVerificationCode(
  userId: number, code: string,
): Promise<{ apiId: number; apiHash: string } | "invalid_code" | "error"> {
  const session = activeSessions.get(userId);
  if (!session) return "error";
  const { page } = session;

  try {
    // ── Find code field using same multi-selector approach ───────────────────
    const codeSelectors = ['input#my_password', 'input[name="password"]'];
    const codeSel = await waitForAny(page, codeSelectors, 10000);
    if (!codeSel) {
      logger.error({ userId }, "submitVerificationCode: code field gone");
      await closeSession(userId);
      return "error";
    }

    await fillField(page, codeSel, code);
    await new Promise(r => setTimeout(r, 500));

    // Submit
    const btnClicked = await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>('button[type="submit"]');
      if (btn && !btn.disabled) { btn.click(); return true; }
      return false;
    });
    if (!btnClicked) {
      await page.focus(codeSel);
      await page.keyboard.press("Enter");
    }

    // Wait for navigation away from /auth
    try {
      await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 });
    } catch {
      // navigation might not fire if it's a SPA transition — check URL anyway
    }

    const currentUrl = page.url();
    logger.info({ userId, currentUrl }, "submitVerificationCode: after submit");

    if (currentUrl.includes("/auth")) {
      const bodyText = await page.$eval("body", el => (el as HTMLElement).innerText).catch(() => "");
      logger.warn({ userId, bodyText: bodyText.slice(0, 200) }, "submitVerificationCode: still on auth page");
      return "invalid_code";
    }

    return await extractOrCreateApp(userId, page);
  } catch (err) {
    logger.error({ err, userId }, "submitVerificationCode error");
    await closeSession(userId);
    return "error";
  }
}

async function extractOrCreateApp(
  userId: number, page: Page,
): Promise<{ apiId: number; apiHash: string } | "error"> {
  try {
    await page.goto("https://my.telegram.org/apps", { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // ── Check for existing app ────────────────────────────────────────────────
    const appIdEl   = await page.$("#app_id");
    const appHashEl = await page.$("#app_hash");
    if (appIdEl && appHashEl) {
      const apiId   = await page.$eval("#app_id",  el => parseInt((el as HTMLInputElement).value || el.textContent || "0", 10));
      const apiHash = await page.$eval("#app_hash", el => ((el as HTMLInputElement).value || el.textContent || "").trim());
      await closeSession(userId);
      if (apiId && apiHash) {
        logger.info({ userId, apiId }, "extractOrCreateApp: existing app found ✓");
        return { apiId, apiHash };
      }
    }

    // ── Create new app ────────────────────────────────────────────────────────
    const titleSel = await waitForAny(page, ['input[name="app_title"]'], 15000);
    if (!titleSel) {
      const body = await page.$eval("body", el => (el as HTMLElement).innerText).catch(() => "");
      logger.error({ userId, body: body.slice(0, 400) }, "extractOrCreateApp: app_title field not found");
      await closeSession(userId);
      return "error";
    }

    await fillField(page, 'input[name="app_title"]',     generateAppTitle());
    await fillField(page, 'input[name="app_shortname"]', generateShortName());
    const platformSelect = await page.$('select[name="app_platform"]');
    if (platformSelect) await page.select('select[name="app_platform"]', "android");
    await new Promise(r => setTimeout(r, 500));

    const btnClicked = await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>('button[type="submit"], input[type="submit"]');
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (!btnClicked) await page.keyboard.press("Enter");

    await new Promise(r => setTimeout(r, 5000));

    const apiId   = await page.$eval("#app_id",  el => parseInt((el as HTMLInputElement).value || el.textContent || "0", 10)).catch(() => 0);
    const apiHash = await page.$eval("#app_hash", el => ((el as HTMLInputElement).value || el.textContent || "").trim()).catch(() => "");
    await closeSession(userId);

    if (!apiId || !apiHash) {
      logger.error({ userId }, "extractOrCreateApp: failed to get credentials after create");
      return "error";
    }
    logger.info({ userId, apiId }, "extractOrCreateApp: new app created ✓");
    return { apiId, apiHash };
  } catch (err) {
    logger.error({ err, userId }, "extractOrCreateApp error");
    await closeSession(userId);
    return "error";
  }
}
