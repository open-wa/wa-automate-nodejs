# syntax = docker/dockerfile:1.3-labs
FROM node:current-bullseye-slim
ENV APP_DIR=/usr/src/app


ENV SKIP_GITIGNORE_CHECK true
ENV NODE_ENV production

# Add your custom ENV vars here:
ENV WA_POPUP true
ENV IS_DOCKER=true
ENV WA_DISABLE_SPINS true
ENV WA_EXECUTABLE_PATH=/usr/bin/google-chrome
ENV WA_CLI_CONFIG=/config
ENV CHROME_PATH=${WA_EXECUTABLE_PATH}
ENV WA_USE_CHROME=true

ENV CLOUDFLARED_BIN="/usr/src/bin/cloudflared"
ENV PUPPETEER_CHROMIUM_REVISION=${PUPPETEER_CHROMIUM_REVISION}
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PLAYWRIGHT_BROWSERS_PATH=${APP_DIR}

COPY . $APP_DIR

WORKDIR $APP_DIR

RUN <<eot bash
  mkdir -p /usr/src/app
  mkdir -p /usr/src/app/node_modules
  mkdir -p /config
  mkdir -p /sessions
  chown -R owauser:owauser /tmp
  apt update
  apt install git nano dumb-init locales -y
  locale-gen en_US.UTF-16
  dpkg --print-architecture
  if [ $(dpkg --print-architecture) == "arm64" ];
  then
    echo "Installing arm64 dependencies"
    cd $APP_DIR
    dpkg --configure -a --ignore-depends=grub
    apt -y -qq install libgtk2.0-0 libsm6 libatk-bridge2.0-0 libc6-dev libdrm2 libice6 libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm-dev libgbm1 libgcc1 libgconf-2-4 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6
    PUPPETEER_SKIP_DOWNLOAD=true npm i puppeteer playwright-core os util extract-zip fs-extra lodash node-fetch rimraf
    dpigs
    npm run postinstall
    npm uninstall playwright-core os util extract-zip fs-extra lodash node-fetch rimraf
  else
    echo "Installing dependencies"
    apt install nano wget --no-install-recommends  -y
    apt upgrade -y
    cd /tmp
    npx playwright@latest install --with-deps chrome --force
    rm -rf WidevineCdm/
    cd locales
    ls | grep -v file.txt | xargs rm
  fi
  npm install -g npm@latest
  apt autoremove -y
  rm -rf /var/lib/apt/lists/*
  rm -rf /usr/share/doc/*
  rm -rf /usr/share/icons/*
  groupadd -r owauser && useradd -r -g owauser -G audio,video owauser
  mkdir -p /home/owauser/Downloads
  chown -R owauser:owauser /home/owauser
  chown -R owauser:owauser /sessions
  chown -R owauser:owauser /config
  chown -R owauser:owauser /usr/src/app/node_modules
  chown -R owauser:owauser ${WA_EXECUTABLE_PATH}
  cd /usr/src/app
  chown -R owauser:owauser /usr/src/app
  npm i @open-wa/wa-automate@latest --ignore-scripts
  npm cache clean --force
eot

ENV LANG en_US.UTF-16

RUN npm prune --production && chown -R owauser:owauser $APP_DIR


RUN if ! which cloudflared > /dev/null 2>&1; then \
        npx cloudflared@latest bin install; \
    fi
# test with root later
USER owauser

ENTRYPOINT ["/usr/bin/dumb-init", "--", "./start.sh", "./node_modules/@open-wa/wa-automate/bin/server.js", "--use-chrome", "--in-docker", "--qr-timeout", "0", "--popup", "--debug", "--force-port"]