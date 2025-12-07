#!/bin/bash 
set -e
# When docker restarts, this file is still there,
# so we need to kill it just in case
[ -f /tmp/.X99-lock ] && rm -f /tmp/.X99-lock

_kill_procs() {
  kill -TERM $node
  # kill -TERM $xvfb
}

# Relay quit commands to processes
trap _kill_procs SIGTERM SIGINT

# Xvfb :99 -screen 0 1024x768x16 -nolisten tcp -nolisten unix &
# xvfb=$!

#Set the desired version, fallback to latest
WA_AUTOMATE_VERSION="${W_A_V:-latest}"

export DISPLAY=:99

echo "Starting the application"
echo "Using version: $WA_AUTOMATE_VERSION"
echo $@
if [[ $@ == *"--no-update"* ]]; then
  echo "Skipping update"
  else eval "PUPPETEER_SKIP_DOWNLOAD=true npm i @open-wa/wa-automate@$WA_AUTOMATE_VERSION --ignore-scripts"
fi
exec node $@
# exec dumb-init -- node ./node_modules/@open-wa/wa-automate/bin/server.js $@
# node=$!
# echo "PID: $node"
# wait $node
# wait $xvfb