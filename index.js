const express = require("express");
const puppeteer = require("puppeteer");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use("/screenshots", express.static(path.join(__dirname, "screenshots")));

app.get("/", async (req, res) => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  // ✅ Load cookies
  const cookiesPath = path.join(__dirname, "cookies.json");
  if (fs.existsSync(cookiesPath)) {
    const cookies = JSON.parse(fs.readFileSync(cookiesPath, "utf-8"));
    await page.setCookie(...cookies);
    console.log("🍪 Cookies loaded");
  }

  // ✅ Open target site (before setting localStorage)
  await page.goto("https://www.allpanelexch.com", { waitUntil: "domcontentloaded" });

  // ✅ Set localStorage for session
  await page.evaluate(() => {
    localStorage.setItem("_grecaptcha", "09ANMylNAw_96FCSUYbykdxQcjra2B1sMy66Os45Cfx48ytrQEHL-9ZOXaEipq0Uq9VD4vSCv5B_68Y7CYARhEJVo5ZvkCgYA03DkyRCKzzotmkrutIUpOP3jRio-f9rdl");
    localStorage.setItem("clientAddr", "223.178.213.219");
    localStorage.setItem("persist:root", "{\"token\":\"\\\"5389a91a-9ab6-4cd0-a1ad-cbe255e07af6\\\"\",\"logedIn\":\"true\",\"rulesLogin\":\"false\",\"popUpLogin\":\"false\",\"data\":\"{\\\"uname\\\":\\\"Demo\\\",\\\"bal\\\":1500,\\\"exp\\\":0,\\\"bcode\\\":\\\"75108921047\\\",\\\"isDemoUser\\\":true}\",\"_persist\":\"{\\\"version\\\":-1,\\\"rehydrated\\\":true}\"}");
  });

  // ✅ Reload for localStorage to apply
  await page.reload({ waitUntil: "networkidle2" });
  console.log("✅ Page loaded");

  // ✅ Screenshot to confirm login
  const screenshotPath = path.join(__dirname, "screenshots", "page.png");
  fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
  await page.screenshot({ path: screenshotPath });
  console.log("📸 Screenshot saved");

  // ✅ Response to user
  res.send("✅ Puppeteer running. View screenshot at: <a href='/screenshots/page.png' target='_blank'>/screenshots/page.png</a>");

  // ✅ Intercept requests
  await page.setRequestInterception(true);

  page.on("request", async (reqIntercept) => {
    const url = reqIntercept.url();
    const method = reqIntercept.method();

    if (url.includes("/api/front/placebet") && method === "POST") {
      const postData = reqIntercept.postData();
      console.log("🔥 Intercepted /placebet:", postData);

      // try {
      //   await axios.post(
      //     process.env.BACKEND_URL || "http://localhost:4000/api/receive-bet",
      //     { data: postData }
      //   );
      //   console.log("📨 Forwarded to backend");
      // } catch (err) {
      //   console.error("❌ Failed to forward:", err.message);
      // }
    }

    reqIntercept.continue();
  });

  // ✅ Close browser after 10 min
  setTimeout(() => {
    browser.close();
    console.log("🛑 Puppeteer closed");
  }, 10 * 60 * 1000);
});

app.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
});
