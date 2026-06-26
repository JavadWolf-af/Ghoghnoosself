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
  const adj  = ["Swift", "Prime", "Nova", "Apex", "Core", "Star", "Flex", "Wave", "Bolt", "Edge"];
  const noun = ["App", "Hub", "Link", "Net", "Box", "Lab", "Zone", "Pro", "Kit", "Sync"];
  return adj[Math.floor(Math.random() * adj.length)]! + noun[Math.floor(Math.random() * noun.length)]!;
}

function generateShortName(): string {
  return randomStr(6) + Math.floor(Math.random() * 9999).toString().padStart(4, "0");
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
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
      ],
    });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );
    activeSessions.set(userId, { browser, page });

    await page.goto("https://my.telegram.org/auth", { waitUntil: "networkidle2", timeout: 30000 });

    await page.waitForSelector('input[name="phone"]', { timeout: 15000 });
    await page.focus('input[name="phone"]');
    await page.evaluate((phone: string) => {
      const el = document.querySelector<HTMLInputElement>('input[name="phone"]');
      if (el) { el.value = ""; el.dispatchEvent(new Event("input", { bubbles: true })); }
    }, phoneNumber);
    await page.type('input[name="phone"]', phoneNumber, { delay: 60 });

    const submitBtn = await page.$('button[type="submit"]');
    if (!submitBtn) throw new Error("Submit button not found");
    await submitBtn.click();

    await page.waitForSelector('input[name="password"]', { timeout: 20000 });

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
    await page.waitForSelector('input[name="password"]', { timeout: 8000 });
    await page.focus('input[name="password"]');
    await page.evaluate(() => {
      const el = document.querySelector<HTMLInputElement>('input[name="password"]');
      if (el) { el.value = ""; el.dispatchEvent(new Event("input", { bubbles: true })); }
    });
    await page.type('input[name="password"]', code, { delay: 60 });

    const submitBtn = await page.$('button[type="submit"]');
    if (!submitBtn) throw new Error("Submit button not found");
    await submitBtn.click();

    await new Promise((r) => setTimeout(r, 4000));

    const currentUrl = page.url();
    if (currentUrl.includes("/auth")) {
      const errEl = await page.$(".error, .alert-danger, [class*='error']");
      if (errEl) return "invalid_code";
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
  userId: number,
  page: Page,
): Promise<{ apiId: number; apiHash: string } | "error"> {
  try {
    await page.goto("https://my.telegram.org/apps", { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    const appIdEl    = await page.$("#app_id");
    const appHashEl  = await page.$("#app_hash");

    if (appIdEl && appHashEl) {
      const apiId   = await page.$eval("#app_id",   (el) => parseInt((el as HTMLInputElement).value || el.textContent || "0", 10));
      const apiHash = await page.$eval("#app_hash",  (el) => ((el as HTMLInputElement).value || el.textContent || "").trim());
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

    await new Promise((r) => setTimeout(r, 4000));

    const apiId   = await page.$eval("#app_id",   (el) => parseInt((el as HTMLInputElement).value || el.textContent || "0", 10)).catch(() => 0);
    const apiHash = await page.$eval("#app_hash",  (el) => ((el as HTMLInputElement).value || el.textContent || "").trim()).catch(() => "");

    await closeSession(userId);
    if (!apiId || !apiHash) return "error";
    return { apiId, apiHash };
  } catch (err) {
    logger.error({ err, userId }, "extractOrCreateApp error");
    await closeSession(userId);
    return "error";
  }
}
