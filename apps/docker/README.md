# wa-automate-docker

This app runs the Open-WA API server in a Docker container. The Compose example binds the API to `127.0.0.1`, installs the latest open-wa release when it starts, and saves the login in a named volume.

## Instructions

Set an API key and start the Compose service from this directory:

```bash
export WA_API_KEY='replace-with-a-long-random-key'
docker compose up -d
```

Open-WA listens on port `8080` inside the container, and Compose publishes it on `127.0.0.1:8080`. `WA_SESSION_DATA_PATH` saves the login file, `MY_SESSION.data.json`, in the `sessions` volume, so the account stays linked when the container is replaced. Keep the API on loopback or a private network unless you have configured an appropriate access boundary.

## Versioning

The Compose file sets `W_A_V` to `latest`, so the container entrypoint installs the newest release each time it starts. For repeatable restarts, set `W_A_V` to a published [wa-automate version](https://github.com/open-wa/wa-automate-nodejs/releases), such as `5.13.0`.
