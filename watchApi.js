const express = require("express");
const puppeteer = require("puppeteer");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", async (req, res) => {
  console.log("📥 Received trigger to start Puppeteer");

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setRequestInterception(true);

  page.on("request", async (reqIntercept) => {
    if (reqIntercept.url().includes("/api/front/placebet") && reqIntercept.method() === "POST") {
      const postData = reqIntercept.postData();
      console.log("🔥 Intercepted placebet:", postData);
      try {
        await axios.post("https://your-backend/api/receive-bet", { data: postData });
      } catch (err) {
        console.error("❌ Error forwarding bet:", err.message);
      }
    }
    reqIntercept.continue();
  });

  await page.goto("https://www.allpanelexch.com");
  console.log("✅ Puppeteer is watching the site");

  res.send("✅ Puppeteer launched");
});

app.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
});
