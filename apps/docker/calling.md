# Calling in the Docker image

The source image packages the normal wa-automate CLI, its Puppeteer driver, the dashboard and the managed audio decoder. The CLI runs as a non-root user with Chrome's sandbox enabled. The existing Dockerfile installs Google Chrome for amd64; other architectures need an appropriate Chrome image.

Calling is a licensed preview. Building this image does not enable a calling cohort or deploy its private implementation. The image has not yet completed a real Docker call journey.

Build from the monorepo root:

```sh
docker build -f apps/docker/Dockerfile -t openwa-calling .
```

Mount your configuration and session directory, retain enough shared memory for Chrome, and let the init process forward shutdown signals:

```sh
docker run --init --shm-size=1g \
  -p 127.0.0.1:8080:8080 \
  -v "$PWD/calling-config.json:/usr/src/app/wa.config.json:ro" \
  -v "$PWD/sessions:/sessions" \
  -v "$PWD/audio:/audio" \
  openwa-calling
```

Use inline configuration values in calling-config.json:

```json
{
  "sessionId": "calling",
  "licenseKey": "YOUR_CALLING_LICENSE",
  "headless": true,
  "dashboard": true,
  "host": "0.0.0.0",
  "port": 8080,
  "sessionDataPath": "/sessions",
  "apiKey": "YOUR_DEPLOYMENT_API_KEY"
}
```

The deployment key protects network media admission, including requests crossing a Docker network. The ordinary loopback SDK demo does not need an API key. Use the dashboard's connection settings with your deployment key. For access from another computer, provide HTTPS/WSS and the same configured API authentication.

For the headless host, choose files, URLs or application streams explicitly. Container device defaults do not create a physical microphone, speaker or camera. The dashboard can instead use the operator's browser devices through its media helper. Use absolute host API paths such as `/audio/greeting.wav` for the mounted audio directory; relative paths resolve against the container's working directory. Files used by SocketClient resolve beside that helper.

Audio injection uses browser media tracks and the bundled decoder. It does not require a virtual sound card or V4L2 loopback. Camera/media support beyond the current audio preview remains separate work. Closing the session closes owned call scopes before Chrome exits; graceful termination finalizes recordings. A forced container kill cannot guarantee a final WAV header.
