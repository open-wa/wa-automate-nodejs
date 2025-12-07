#!/bin/bash

# First make sure to create a user called admin
# adduser admin --ingroup sudo
# su admin
# Remove admin user from ssh list
# By adding "DenyUsers admin"
# to the end of /etc/ssh/sshd_config
# echo "DenyUsers admin >> /etc/ssh/sshd_config
ADMINUSER=admin

if grep -Fxq "DenyUsers admin" /etc/ssh/sshd_config
then
  echo "Admin already disallowed from ssh access"
else
  sudo echo "DenyUsers admin" >> /etc/ssh/sshd_config
  echo "Admin no longer allowed ssh access"
fi

sudo apt install curl gpg-agent git -y
sudo mkdir /sessions
sudo chown -R admin /sessions
sudo curl https://pkg.cloudflare.com/cloudflare-main.gpg -o /usr/share/keyrings/cloudflare-main.gpg
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/ focal main' | sudo tee /etc/apt/sources.list.d/cloudflare-main.list
curl -fsSL https://deb.nodesource.com/setup_current.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add - && echo 'deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main' | sudo tee /etc/apt/sources.list.d/google-chrome.list && sudo apt-get update -y
sudo apt install moreutils cloudflared glances google-chrome-stable gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget libnss3-dev -y
# sudo apt install npm -y
sudo ufw deny out 22
cd
mkdir /home/$ADMINUSER/orch && cd /home/$ADMINUSER/orch
sudo chown -R $ADMINUSER /usr/local/lib/node_modules/ || true
sudo chown -R $ADMINUSER /usr/local/bin/ || true
sudo chown -R $ADMINUSER /usr/local/share/ || true
sudo chown -R 1000:27 "/home/admin/.npm"
sudo npm i -g npm
sudo npm install -g npm-cli-login cross-env
npm init -y
npm config set @open-wa-enterprise:registry https://registry.openwa.cloud
# Create the user login details if they dont exist already
# if [[ -z $NPM_U || -z $NPM_P || -z $NPM_E ]]; then
#   echo 'one or more variables required to login to the npm registry are undefined'
#   exit 1
# fi
npm-cli-login -u $NPM_U -p $NPM_P -e $NPM_E -r https://registry.openwa.cloud
npm i --save cross-env
npm i --save @open-wa-enterprise/wa-orchestrate
touch .env
sudo chown -R $ADMINUSER /home/$ADMINUSER/orch || true
echo "USE_CHROME=true" >> .env
# Create the bucket details. Required: OWA_ID, AND OWA_SECRET
if [ -n "$OWA_ID" ]; then echo "OWA_ID=$OWA_ID" >> .env ; else echo "OWA_ID not set, add it to .env later"; fi
if [ -n "$OWA_SECRET" ]; then echo "OWA_SECRET=$OWA_SECRET" >> .env ; else echo "OWA_SECRET not set, add it to .env later"; fi
# replace duplicates in .env
awk '!seen[$0]++' .env  | sponge .env  > /dev/null