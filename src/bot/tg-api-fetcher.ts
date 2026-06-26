import puppeteer from "puppeteer";
import type { Browser, Page } from "puppeteer";
import { logger } from "../lib/logger";

// ── Stealth: injected into every new page to hide automation fingerprints ─
const STEALTH_SCRIPT = `
  // 1. hide webdriver flag
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  // 2. fake chrome runtime
  window.chrome = { runtime: {} };
  // 3. fix navigator.plugins (empty in headless)
  Object.defineProperty(navigator, 'plugins', { get: () => [1,2,3,4,5] });
  // 4. fix navigator.languages
  Object.defineProperty(navigator, 'languages', { get: () => ['en-US','en'] });
  // 5. hide headless in userAgent
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

async function fillField(page: Page, selector: string, value: string): Promise<void> {
  await page.click(selector, { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await page.type(selector, value, { delay: 60 + Math.random() * 60 });
}

export async function startPhoneLogin(userId: number, phoneNumber: string): Promise<"ok" | "error"> {
  try {
    await closeSession(userId);

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox", "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", "--disable-gpu",
        "--no-first-run", "--no-zygote", "--single-process",
        "--window-size=1280,800",
      ],
    });

    const page = await browser.newPage();
    // inject stealth before any page loads
    await page.evaluateOnNewDocument(STEALTH_SCRIPT);
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.155 Safari/537.36",
    );
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
    activeSessions.set(userId, { browser, page });

    await page.goto("https://my.telegram.org/auth", { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    await page.waitForSelector('input[name="phone"]', { timeout: 20000 });
    await fillField(page, 'input[name="phone"]', phoneNumber);
    await new Promise(r => setTimeout(r, 800 + Math.random() * 400));

    // Click submit
    const submitted = await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>('button[type="submit"]');
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (!submitted) throw new Error("Submit button not found");

    logger.info({ userId }, "startPhoneLogin: submitted phone, waiting for code field");

    // Wait for OTP code input (Telegram uses input[name="password"])
    try {
      await page.waitForSelector('input[name="password"]', { timeout: 20000 });
      logger.info({ userId }, "startPhoneLogin: code field appeared ✓");
      return "ok";
    } catch {
      const bodyText = await page.$eval("body", el => (el as HTMLElement).innerText).catch(() => "");
      logger.warn({ userId, bodyText: bodyText.slice(0, 300) }, "startPhoneLogin: code field not found");
      if (bodyText.includes("Too many") || bodyText.includes("flood")) {
        await closeSession(userId);
        return "error";
      }
      return "ok"; // optimistic — code may still arrive
    }
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
    await page.waitForSelector('input[name="password"]', { timeout: 10000 });
    await fillField(page, 'input[name="password"]', code);
    await new Promise(r => setTimeout(r, 500));

    await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>('button[type="submit"]');
      if (btn) btn.click();
    });

    // Wait for navigation away from /auth
    await Promise.race([
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }),
      new Promise(r => setTimeout(r, 15000)),
    ]);

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

    // Create new app
    await page.waitForSelector('input[name="app_title"]', { timeout: 15000 });
    await fillField(page, 'input[name="app_title"]',     generateAppTitle());
    await fillField(page, 'input[name="app_shortname"]', generateShortName());
    const platformSelect = await page.$('select[name="app_platform"]');
    if (platformSelect) await page.select('select[name="app_platform"]', "android");
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>('button[type="submit"], input[type="submit"]');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 5000));

    const apiId   = await page.$eval("#app_id",  el => parseInt((el as HTMLInputElement).value || el.textContent || "0", 10)).catch(() => 0);
    const apiHash = await page.$eval("#app_hash", el => ((el as HTMLInputElement).value || el.textContent || "").trim()).catch(() => "");
    await closeSession(userId);

    if (!apiId || !apiHash) {
      logger.error({ userId }, "extractOrCreateApp: failed to get credentials");
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
