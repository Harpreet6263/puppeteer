const express = require("express");
const puppeteer = require("puppeteer");
const axios = require("axios");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    // Load saved cookies
    const cookies = JSON.parse(fs.readFileSync("./cookies.json", "utf-8"));
    await page.setCookie(...cookies);
    console.log("🍪 Cookies loaded");

    await page.setRequestInterception(true);

    page.on("request", async (reqIntercept) => {
      const url = reqIntercept.url();
      const method = reqIntercept.method();

      if (url.includes("/api/front/placebet") && method === "POST") {
        const postData = reqIntercept.postData();
        console.log("🔥 Intercepted placebet:", postData);

        try {
          await axios.post(process.env.BACKEND_URL || "https://your-backend.com/api/receive-bet", {
            data: postData
          });
          console.log("📨 Forwarded payload");
        } catch (err) {
          console.error("❌ Forward error:", err.message);
        }
      }

      reqIntercept.continue();
    });

    await page.goto("https://www.allpanelexch.com", { waitUntil: "networkidle2" });
    console.log("✅ Watching site in background");

    res.send("✅ Puppeteer is monitoring allpanelexch.com");

    // Keep running for 10 mins
    setTimeout(() => {
      browser.close();
      console.log("🛑 Browser closed");
    }, 10 * 60 * 1000);
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).send("❌ Failed to start Puppeteer");
  }
});

app.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
});
