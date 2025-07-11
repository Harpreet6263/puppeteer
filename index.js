const express = require("express");
const puppeteer = require("puppeteer");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: true, // stays headless on Railway
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setRequestInterception(true);

    page.on("request", async (interceptedRequest) => {
      const url = interceptedRequest.url();
      const method = interceptedRequest.method();

      if (url.includes("/api/front/placebet") && method === "POST") {
        const postData = interceptedRequest.postData();
        console.log("🔥 Intercepted placebet:", postData);

        try {
          await axios.post(process.env.BACKEND_URL || "https://your-backend.com/api/receive-bet", {
            data: postData
          });
          console.log("📨 Forwarded payload");
        } catch (err) {
          console.error("❌ Forwarding error:", err.message);
        }
      }

      interceptedRequest.continue();
    });

    await page.goto("https://www.allpanelexch.com", { waitUntil: "networkidle2" });
    console.log("✅ Login page loaded — waiting for manual login...");

    res.send("✅ Puppeteer opened the login page. Please log in manually.");

    // Keep browser open for 10 mins (adjust as needed)
    setTimeout(() => {
      browser.close();
      console.log("🛑 Browser closed after timeout.");
    }, 10 * 60 * 1000); // 10 minutes

  } catch (error) {
    console.error("❌ Puppeteer failed:", error);
    res.status(500).send("❌ Failed to launch Puppeteer");
  }
});

app.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
});
