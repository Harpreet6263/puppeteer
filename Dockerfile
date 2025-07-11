FROM node:20-slim

# Install Chromium dependencies
RUN apt-get update && apt-get install -y \
  wget \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libgbm1 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app
COPY . .

# Install dependencies (this will download Chromium)
RUN npm install --omit=dev

# ✅ DO NOT SET ANY `PUPPETEER_EXECUTABLE_PATH`!
# ✅ Chromium path will be auto-detected

# Start the server
CMD ["node", "index.js"]
