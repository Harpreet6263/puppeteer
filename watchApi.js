const axios = require("axios");
const puppeteer = require("puppeteer");

(async () => {
  console.log("🚀 Starting Puppeteer watcher...");

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: null
  });

  const page = await browser.newPage();
  await page.setRequestInterception(true);

  await page.setViewport({
    width: 1540,
    height: 768,
    deviceScaleFactor: 1
  });

  page.on("request", async (req) => {
    const url = req.url();

    if (url.includes("/api/front/placebet") && req.method() === "POST") {
      const postData = req.postData();
      console.log("🔥 Intercepted /placebet:", postData);
      try {
        await axios.post("http://localhost:4000/api/receive-bet", { data: postData });
        console.log("📨 Forwarded placebet payload");
      } catch (err) {
        console.error("❌ Failed to forward placebet payload:", err.message);
      }
    }

    if (url.includes("/api/front/userdata") && req.method() === "POST") {
      const headers = req.headers();
      const cookies = headers["cookie"];
      console.log("🍪 Intercepted /userdata cookies:", cookies);
      // Forward or store cookies here if needed
    }

    req.continue();
  });

  await page.goto("https://www.allpanelexch.com");
  console.log("✅ Site loaded. Login manually if needed.");
})();
