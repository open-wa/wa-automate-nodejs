# Step by step Digital Ocean deployment

## logs for the new ubuntu server setup FROM A NON ROOT USER [nodejs]:

```bash
> sudo -u nodejs wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add - && echo 'deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main' | sudo tee /etc/apt/sources.list.d/google-chrome.list && sudo apt-get update && sudo apt install google-chrome-stable gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget libnss3-dev -y && sudo apt-get upgrade -y
```

```bash
> node --version #confirm that it is v12.18.3
```

## Follow this tutorial to fix npm permissions issue: https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally

```bash
> npm i -g @open-wa/wa-automate pm2
> npx @open-wa/wa-automate #confirm that it is working and brings up a qr code
```

## Extract this project into a foler

## cd into the folder

## change the port and ip address on lines 8 & 9 of index.js

```bash
npm i
npm run start
```

## put the process in the background [optional]

```bash
> ctrl+z
> bg
```

## see the monitor

```bash
> pm2 monit
```

## Optional: Exposing the port if not already using port 3000

## enable the firewall

```bash
> sudo ufw enable
```

## enable the admin api port [https://www.digitalocean.com/community/tutorials/how-to-set-up-a-firewall-with-ufw-on-ubuntu-18-04]

```bash
> sudo ufw allow 5432
```

# Setting up pm2 and api key for machine

1. Set with .env file
2. Set with env