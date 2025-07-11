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

  // Load cookies
  const cookiesPath = path.join(__dirname, "cookies.json");
  if (fs.existsSync(cookiesPath)) {
    const cookies = JSON.parse(fs.readFileSync(cookiesPath, "utf-8"));
    await page.setCookie(...cookies);
    console.log("🍪 Cookies loaded");
  }

  // Intercept network requests
  await page.setRequestInterception(true);
  page.on("request", async (reqIntercept) => {
    const url = reqIntercept.url();
    const method = reqIntercept.method();

    console.log("🌐 Watching:", url);

    if (url.includes("/api/front/placebet") && method === "POST") {
      const postData = reqIntercept.postData();
      console.log("🔥 Intercepted /placebet:", postData);

      // Optional: forward it to your backend
      try {
        await axios.post(
          process.env.BACKEND_URL || "https://your-backend.com/api/receive-bet",
          { data: postData }
        );
        console.log("📨 Forwarded to backend");
      } catch (err) {
        console.error("❌ Failed to forward:", err.message);
      }
    }

    reqIntercept.continue();
  });

  // Open target site
  await page.goto("https://www.allpanelexch.com", { waitUntil: "networkidle2" });
  console.log("✅ Page loaded");

  // Screenshot to verify login
  const screenshotPath = path.join(__dirname, "screenshots", "page.png");
  fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
  await page.screenshot({ path: screenshotPath });
  console.log("📸 Screenshot saved");

  res.send("✅ Puppeteer running. View: /screenshots/page.png");

  // Keep watching for 10 minutes
  setTimeout(() => {
    browser.close();
    console.log("🛑 Puppeteer closed");
  }, 10 * 60 * 1000);
});

app.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
});
