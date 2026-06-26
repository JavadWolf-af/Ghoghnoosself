import puppeteer, { Browser, Page } from "puppeteer";
import { logger } from "../lib/logger";

interface SessionData {
  browser: Browser;
  page: Page;
}

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
  const session = activeSessions.get(userId);
  if (session) {
    try { await session.browser.close(); } catch { /* ignore */ }
    activeSessions.delete(userId);
  }
}

export async function cancelTgSession(userId: number): Promise<void> {
  await closeSession(userId);
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
        "--disable-blink-features=AutomationControlled",
      ],
    });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    );
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
    activeSessions.set(userId, { browser, page });

    // ── Navigate to auth page ─────────────────────────────────────────────
    await page.goto("https://my.telegram.org/auth", { waitUntil: "domcontentloaded", timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // ── Wait for phone field ──────────────────────────────────────────────
    await page.waitForSelector('input[name="phone"]', { timeout: 15000 });
    await page.focus('input[name="phone"]');

    // Clear existing value and type phone
    await page.evaluate((phone: string) => {
      const el = document.querySelector<HTMLInputElement>('input[name="phone"]');
      if (el) {
        el.value = "";
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }, phoneNumber);
    await new Promise(r => setTimeout(r, 500));
    await page.type('input[name="phone"]', phoneNumber, { delay: 80 });
    await new Promise(r => setTimeout(r, 800));

    // ── Click submit ──────────────────────────────────────────────────────
    const submitBtn = await page.$('button[type="submit"]');
    if (!submitBtn) throw new Error("Submit button not found");
    await submitBtn.click();

    // ── Wait up to 15s for code field to appear (try multiple selectors) ─
    const codeFieldSelector = await Promise.race([
      page.waitForSelector('input[name="password"]', { timeout: 15000 }).then(() => 'input[name="password"]'),
      page.waitForSelector('input[type="text"]:not([name="phone"])', { timeout: 15000 }).then(() => 'input[type="text"]:not([name="phone"])'),
      new Promise<null>(r => setTimeout(() => r(null), 15000)),
    ]);

    if (!codeFieldSelector) {
      // Check if we're still on the right page at all
      const url = page.url();
      logger.warn({ userId, url }, "startPhoneLogin: no code field found, checking page state");

      // Check for error on page
      const errorText = await page.$eval("body", el => el.innerText).catch(() => "");
      if (errorText.includes("Too many") || errorText.includes("flood")) {
        logger.error({ userId }, "startPhoneLogin: rate limited");
        await closeSession(userId);
        return "error";
      }

      // Even without detecting the field, Telegram may have sent the code.
      // Keep session alive and optimistically return ok.
      logger.info({ userId }, "startPhoneLogin: assuming code was sent");
      return "ok";
    }

    logger.info({ userId, codeFieldSelector }, "startPhoneLogin: code field found");
    return "ok";
  } catch (err) {
    logger.error({ err, userId }, "startPhoneLogin error");
    await closeSession(userId);
    return "error";
  }
}

export async function submitVerificationCode(
  userId: number,
  code: string,
): Promise<{ apiId: number; apiHash: string } | "invalid_code" | "error"> {
  const session = activeSessions.get(userId);
  if (!session) return "error";

  const { page } = session;
  try {
    // Find the code input field — try multiple selectors
    const codeField = await page.$('input[name="password"]') ??
                      await page.$('input[type="text"]:not([name="phone"])') ??
                      await page.$('input[type="number"]');
    if (!codeField) {
      logger.error({ userId }, "submitVerificationCode: code field not found");
      await closeSession(userId);
      return "error";
    }

    await codeField.focus();
    await page.evaluate(() => {
      const selectors = ['input[name="password"]','input[type="text"]:not([name="phone"])','input[type="number"]'];
      for (const sel of selectors) {
        const el = document.querySelector<HTMLInputElement>(sel);
        if (el) { el.value = ""; el.dispatchEvent(new Event("input", { bubbles: true })); break; }
      }
    });
    await codeField.type(code, { delay: 80 });
    await new Promise(r => setTimeout(r, 500));

    const submitBtn = await page.$('button[type="submit"]');
    if (!submitBtn) throw new Error("Submit button not found");
    await submitBtn.click();

    await new Promise(r => setTimeout(r, 5000));

    const currentUrl = page.url();
    if (currentUrl.includes("/auth")) {
      // Still on auth page — check for error message
      const bodyText = await page.$eval("body", el => (el as HTMLElement).innerText).catch(() => "");
      if (bodyText.includes("invalid") || bodyText.includes("wrong") || bodyText.includes("incorrect") ||
          bodyText.includes("اشتباه") || bodyText.includes("نامعتبر")) {
        return "invalid_code";
      }
      // Maybe it's still processing — wait a bit more
      await new Promise(r => setTimeout(r, 3000));
      const urlAfter = page.url();
      if (urlAfter.includes("/auth")) return "invalid_code";
    }

    return await extractOrCreateApp(userId, page);
  } catch (err) {
    logger.error({ err, userId }, "submitVerificationCode error");
    await closeSession(userId);
    return "error";
  }
}

async function extractOrCreateApp(
  userId: number,
  page: Page,
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
      if (apiId && apiHash) return { apiId, apiHash };
    }

    await page.waitForSelector('input[name="app_title"]', { timeout: 10000 });
    const title     = generateAppTitle();
    const shortName = generateShortName();
    await page.type('input[name="app_title"]',     title,     { delay: 40 });
    await page.type('input[name="app_shortname"]', shortName, { delay: 40 });
    const platformSelect = await page.$('select[name="app_platform"]');
    if (platformSelect) await page.select('select[name="app_platform"]', "android");
    const createBtn = await page.$('button[type="submit"], input[type="submit"]');
    if (!createBtn) throw new Error("Create button not found");
    await createBtn.click();
    await new Promise(r => setTimeout(r, 4000));

    const apiId   = await page.$eval("#app_id",  el => parseInt((el as HTMLInputElement).value || el.textContent || "0", 10)).catch(() => 0);
    const apiHash = await page.$eval("#app_hash", el => ((el as HTMLInputElement).value || el.textContent || "").trim()).catch(() => "");
    await closeSession(userId);
    if (!apiId || !apiHash) return "error";
    return { apiId, apiHash };
  } catch (err) {
    logger.error({ err, userId }, "extractOrCreateApp error");
    await closeSession(userId);
    return "error";
  }
}
