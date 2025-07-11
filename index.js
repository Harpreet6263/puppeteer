const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use("/screenshots", express.static(path.join(__dirname, "screenshots")));

app.get("/", async (req, res) => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  // ✅ Optional cookies
  const cookiesPath = path.join(__dirname, "cookies.json");
  if (fs.existsSync(cookiesPath)) {
    const cookies = JSON.parse(fs.readFileSync(cookiesPath));
    await page.setCookie(...cookies);
    console.log("🍪 Cookies loaded");
  }

  await page.goto("https://www.allpanelexch.com", { waitUntil: "domcontentloaded" });

  await page.evaluate(() => {
    localStorage.setItem("persist:root", "{\"token\":\"\\\"VALID_TOKEN\\\"\",\"logedIn\":\"true\"}");
  });

  await page.reload({ waitUntil: "networkidle2" });

  const screenshotPath = path.join(__dirname, "screenshots", "page.png");
  fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
  await page.screenshot({ path: screenshotPath });

  res.send("✅ Puppeteer launched — check /screenshots/page.png");

  // Intercept request
  await page.setRequestInterception(true);

  page.on("request", (intercepted) => {
    const url = intercepted.url();
    console.log("url:", url);
    
    if (url.includes("/api/front/placebet")) {
      console.log("🔥 PlaceBet Payload:", intercepted.postData());
    }
    intercepted.continue();
  });

  // Run 10 min
  setTimeout(() => browser.close(), 10 * 60 * 1000);
});

app.listen(PORT, () => {
  console.log(`🌐 Listening at http://localhost:${PORT}`);
});
