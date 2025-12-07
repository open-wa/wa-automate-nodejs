FROM node:current-stretch

RUN mkdir -p /usr/src/app
RUN mkdir -p /sessions

WORKDIR /usr/src/app

#install chrome
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && echo 'deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main' | tee /etc/apt/sources.list.d/google-chrome.list 

RUN apt update

RUN apt install google-chrome-stable fonts-freefont-ttf libxss1 --no-install-recommends -y \
    && rm -rf /var/lib/apt/lists/*

RUN apt upgrade -y

# skip the puppeteer browser download
ENV PUPPETEER_SKIP_DOWNLOAD true

RUN npm i @open-wa/wa-automate@latest
    # Add user so we don't need --no-sandbox.
    # same layer as npm install to keep re-chowned files from using up several hundred MBs more space
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /usr/src/app \
    && chown -R pptruser:pptruser /sessions \
    && chown -R pptruser:pptruser /usr/src/app/node_modules

USER pptruser

COPY . /usr/src/app

ENV NODE_ENV production
ENV PORT 8080

# Add your custom ENV vars here:
ENV WA_USE_CHROME true
ENV WA_POPUP true
ENV WA_DISABLE_SPINS true
ENV WA_PORT $PORT
ENV WA_EXECUTABLE_PATH /usr/bin/google-chrome-stable

EXPOSE $PORT

ENTRYPOINT [ "node", "./node_modules/@open-wa/wa-automate/bin/server.js", "--in-docker", "--qr-timeout", "0", "--popup", "--debug"]
