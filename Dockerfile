# Use Node.js with Puppeteer
FROM node:20-slim

# Install necessary dependencies for Chromium
RUN apt-get update && apt-get install -y \
  chromium \
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
  wget \
  && rm -rf /var/lib/apt/lists/*

# Set environment for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Create app directory
WORKDIR /app
COPY . .

# Install dependencies
RUN npm install

# Start the server
CMD ["node", "index.js"]
