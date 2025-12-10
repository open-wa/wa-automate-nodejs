# syntax=docker/dockerfile:1.4
# Stage 1: Builder
# Installs build dependencies and performs npm install to compile native modules (if any)
FROM node:20-bullseye-slim AS builder

WORKDIR /usr/src/app

ENV DEBIAN_FRONTEND=noninteractive
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Install build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json .

# Install dependencies (including native modules)
# We install @open-wa/wa-automate explicitly to ensure it's captured
RUN npm install @open-wa/wa-automate@latest --ignore-scripts
RUN npm install --ignore-scripts

# Stage 2: Final Runtime
FROM node:20-bullseye-slim

ENV APP_DIR=/usr/src/app
ENV NODE_ENV=production
ENV WA_POPUP=true
ENV IS_DOCKER=true
ENV WA_DISABLE_SPINS=true
ENV WA_EXECUTABLE_PATH=/usr/bin/google-chrome
ENV WA_CLI_CONFIG=/config
ENV CHROME_PATH=${WA_EXECUTABLE_PATH}
ENV WA_USE_CHROME=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV LANG=en_US.UTF-8

WORKDIR $APP_DIR

# Install runtime dependencies (Chrome, fonts, procps for signals)
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    ca-certificates \
    procps \
    dumb-init \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Install Chrome (stable)
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update && apt-get install -y --no-install-recommends \
    google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Create user
RUN groupadd -r owauser && useradd -r -g owauser -G audio,video owauser \
    && mkdir -p /home/owauser/Downloads \
    && chown -R owauser:owauser /home/owauser \
    && mkdir -p /sessions /config \
    && chown -R owauser:owauser /sessions /config

# Copy node_modules from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json .

# Copy app source (if any locally)
COPY . .

# Fix permissions
RUN chown -R owauser:owauser $APP_DIR

USER owauser

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["./node_modules/.bin/wa-automate", "--use-chrome", "--in-docker", "--qr-timeout", "0", "--popup", "--debug", "--force-port"]