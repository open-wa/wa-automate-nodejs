# syntax=docker/dockerfile:1.4

# Stage 1: Dependencies
FROM node:18 AS deps
ENV DEBIAN_FRONTEND=noninteractive

# Install build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package configuration files for dependency resolution
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/
COPY apps/*/package.json ./apps/

# Fetch dependencies (for deterministic builds)
RUN pnpm fetch

# Stage 2: Builder
FROM node:18 AS builder
ENV DEBIAN_FRONTEND=noninteractive

# Install pnpm
RUN npm install -g pnpm

# Copy source code and dependencies from deps stage
COPY --from=deps /app ./

# Build: monorepo
RUN pnpm build

# Stage 3: Runtime
FROM node:18-slim

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

# Copy built packages from builder stage
COPY --from=builder /app/packages ./packages
# Copy node_modules (includes workspace symlinks)
COPY --from=builder /app/node_modules ./node_modules
# Copy root package.json
COPY --from=builder /app/package.json .

# Fix permissions
RUN chown -R owauser:owauser $APP_DIR

USER owauser

EXPOSE 8080
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "packages/wa-automate/dist/cli.js", "--use-chrome", "--in-docker", "--qr-timeout", "0", "--popup", "--debug", "--force-port"]