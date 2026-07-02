#!/usr/bin/env node
// test-login.mjs — اجرا: node test-login.mjs +989xxxxxxxxx
import puppeteer from "puppeteer";

const phone = process.argv[2];
if (!phone) { console.error("Usage: node test-login.mjs +989xxxxxxxxx"); process.exit(1); }

const log = (step, msg, data = "") => console.log(`[${new Date().toISOString()}] [${step}] ${msg}`, data);

async function test() {
  log("START", "شماره:", phone);

  // ── Step 1: Launch browser ─────────────────────────────────────────────────
  log("1", "باز کردن Chrome...");
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox", "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", "--disable-gpu",
        "--no-first-run", "--no-zygote", "--single-process",
        "--window-size=1280,800",
      ],
    });
    log("1", "✅ Chrome باز شد");
  } catch (err) {
    log("1", "❌ Chrome باز نشد:", err.message);
    process.exit(1);
  }

  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.155 Safari/537.36");
  await page.setViewport({ width: 1280, height: 800 });
  await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

  // Inject stealth
  await page.evaluateOnNewDocument(`
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    window.chrome = { runtime: {} };
    Object.defineProperty(navigator, 'plugins', { get: () => [1,2,3,4,5] });
    const origUA = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', { get: () => origUA.replace('HeadlessChrome', 'Chrome') });
  `);

  // ── Step 2: Load page ──────────────────────────────────────────────────────
  log("2", "رفتن به my.telegram.org/auth ...");
  try {
    await page.goto("https://my.telegram.org/auth", { waitUntil: "networkidle2", timeout: 30000 });
    log("2", "✅ صفحه لود شد — URL:", page.url());
  } catch (err) {
    log("2", "❌ صفحه لود نشد:", err.message);
    await browser.close(); process.exit(1);
  }

  const bodyText = await page.$eval("body", el => el.innerText).catch(() => "");
  log("2", "محتوای صفحه (300 کاراکتر):", bodyText.slice(0, 300));

  // ── Step 3: Find phone field ───────────────────────────────────────────────
  log("3", "پیدا کردن فیلد شماره تلفن...");
  const selectors = ['input[name="phone"]', 'input#my_tel', 'input[type="tel"]'];
  let phoneSel = null;
  for (const sel of selectors) {
    const el = await page.$(sel);
    if (el) { phoneSel = sel; break; }
    log("3", `  ${sel} → پیدا نشد`);
  }

  if (!phoneSel) {
    log("3", "❌ هیچ فیلد شماره‌ای پیدا نشد!");
    const html = await page.content();
    log("3", "HTML صفحه (1000 کاراکتر):", html.slice(0, 1000));
    await browser.close(); process.exit(1);
  }
  log("3", "✅ فیلد پیدا شد:", phoneSel);

  // ── Step 4: Fill phone ─────────────────────────────────────────────────────
  log("4", "وارد کردن شماره:", phone);
  await page.focus(phoneSel);
  await page.keyboard.down("Control");
  await page.keyboard.press("a");
  await page.keyboard.up("Control");
  await page.keyboard.press("Backspace");
  await page.type(phoneSel, phone, { delay: 100 });
  const val = await page.$eval(phoneSel, el => el.value).catch(() => "?");
  log("4", "مقدار فیلد بعد از تایپ:", val);

  // ── Step 5: Submit ─────────────────────────────────────────────────────────
  log("5", "کلیک روی دکمه submit...");
  const btnInfo = await page.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]');
    if (!btn) return null;
    return { text: btn.textContent?.trim(), disabled: btn.disabled, visible: btn.offsetParent !== null };
  });
  log("5", "دکمه submit:", JSON.stringify(btnInfo));

  if (btnInfo) {
    await page.evaluate(() => { document.querySelector('button[type="submit"]')?.click(); });
    log("5", "✅ کلیک انجام شد");
  } else {
    log("5", "دکمه نبود — Enter می‌زنم");
    await page.focus(phoneSel);
    await page.keyboard.press("Enter");
  }

  // ── Step 6: Wait for code field ────────────────────────────────────────────
  log("6", "منتظر ظاهر شدن فیلد کد (25 ثانیه)...");
  let codeSel = null;
  const start = Date.now();
  while (Date.now() - start < 25000) {
    for (const sel of ['input[name="password"]', 'input#my_password']) {
      const el = await page.$(sel);
      if (el) { codeSel = sel; break; }
    }
    if (codeSel) break;
    // Check for error messages
    const body = await page.$eval("body", el => el.innerText).catch(() => "");
    if (body.includes("Too many") || body.includes("flood") || body.includes("error")) {
      log("6", "⚠️  پیام خطا در صفحه:", body.slice(0, 200));
    }
    await new Promise(r => setTimeout(r, 1000));
    process.stdout.write(".");
  }
  console.log("");

  if (!codeSel) {
    log("6", "❌ فیلد کد ظاهر نشد!");
    const body = await page.$eval("body", el => el.innerText).catch(() => "");
    log("6", "محتوای صفحه:", body.slice(0, 400));
    const html = await page.content();
    log("6", "HTML:", html.slice(0, 800));
  } else {
    log("6", "✅ فیلد کد ظاهر شد:", codeSel);
    log("DONE", "🎉 مرحله ارسال کد موفق بود! کد به تلگرام شما ارسال شد.");
  }

  await browser.close();
}

test().catch(err => { console.error("FATAL:", err); process.exit(1); });
