const express = require("express");
const puppeteer = require("puppeteer");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

app.use("/screenshots", express.static(path.join(__dirname, "screenshots")));

app.get("/", async (req, res) => {
  console.log("➡️ Received request");

  try {
    const browser = await puppeteer.launch({
      headless: "new", // works with Puppeteer 22+
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // ✅ Load cookies
    const cookiesPath = path.join(__dirname, "cookies.json");
    if (fs.existsSync(cookiesPath)) {
      const cookies = JSON.parse(fs.readFileSync(cookiesPath, "utf-8"));
      await page.setCookie(...cookies);
      console.log("🍪 Cookies loaded");
    }

    // ✅ Go to site
    await page.goto("https://www.allpanelexch.com", { waitUntil: "domcontentloaded" });

    // ✅ Set localStorage
    await page.evaluate(() => {
      localStorage.setItem("_grecaptcha", "09ANMylNCvDJ6bPKc_ilyXflypAEo8vciUPvs_67PO4AB4me_L6UfHwl95QXCUNpQsCDkAVKL80Iawnqyyx1RESsyY6dRKc-AcCQGAOCBAuouuSdpff0aUltDFnBC8Pb96");
      localStorage.setItem("clientAddr", "223.178.213.219");
      localStorage.setItem("persist:root", "{\"token\":\"\\\"af5a808f-2fb7-4511-89f4-611b384c8c6f\\\"\",\"logedIn\":\"true\",\"rulesLogin\":\"false\",\"popUpLogin\":\"false\",\"data\":\"{\\\"uname\\\":\\\"Demo\\\",\\\"bal\\\":1500,\\\"exp\\\":0,\\\"bcode\\\":\\\"76915510428\\\",\\\"isDemoUser\\\":true}\",\"_persist\":\"{\\\"version\\\":-1,\\\"rehydrated\\\":true}\"}");
    });


    await page.reload({ waitUntil: "networkidle2" });
    console.log("✅ Page loaded");

    // ✅ Screenshot
    const screenshotPath = path.join(__dirname, "screenshots", "page.png");
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath });
    console.log("📸 Screenshot saved");

    // ✅ Intercept requests
    await page.setRequestInterception(true);
    page.on("request", async (reqIntercept) => {
      const url = reqIntercept.url();
      const method = reqIntercept.method();

      if (url.includes("/api/front/placebet") && method === "POST") {
        const postData = reqIntercept.postData();
        console.log("🔥 Intercepted /placebet:", postData);
      }

      reqIntercept.continue();
    });

    res.send("✅ Puppeteer running. <a href='/screenshots/page.png'>View Screenshot</a>");

    // Close after 10 mins
    setTimeout(() => {
      browser.close();
      console.log("🛑 Puppeteer closed");
    }, 10 * 60 * 1000);
  } catch (err) {
    console.error("❌ Error occurred:", err.message);
    res.status(500).send("❌ Something went wrong");
  }
});

app.listen(PORT, () => {
  console.log(`🌐 Listening at http://localhost:${PORT}`);
});
