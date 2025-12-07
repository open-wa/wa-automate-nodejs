# wa-automate-docker

This repo shows a simple way to create a memory efficient API out of your WhatsApp account using docker.

## Instructions

```bash
> docker run [ ... docker flags] --init openwa/wa-automate [... cli flags]
```

It is important to add the `--init` flag to make sure zombie processes are garbage collected properly

The default internal port is 8080. Set `-e PORT=3000` in the `docker flags` section to set the internal port to `3000`.

For example:

```bash
# Defaults
> docker run -p 8080:8080 --init openwa/wa-automate

# Devices with arm64 processors (Raspberry Pi`s, Apple M1, etc...)
> docker run --platform linux/arm64 -p 8080:8080 openwa/wa-automate

# Custom webhook, port & socket mode enabled for easy integration with node-red
> docker run -p 8080:8085 --init openwa/wa-automate -w -p 8085 https://webhook.site.... --socket

# You can also use environment variables to set the port
> docker run -e PORT=8085 -p 8080:8085 --init openwa/wa-automate -w https://webhook.site.... --socket
```

## Versioning

The only tag for this docker image is `latest`. On launch of the docker container, the latest version of the main library is checked and updated. So all you need to do to use the latest [wa-automate](https://github.com/open-wa/wa-automate-nodejs) code is to restart your container.

Sometimes you may want to use a previous version of the library, or just pin it due to stability reasons, in this case you can set the environment variable `W_A_V` to your [desired wa-automate library version](https://github.com/open-wa/wa-automate-nodejs/releases). For example:

```bash
# Same setup as above but with library version 4.42.1
> docker run -e W_A_V=4.42.1 -p 8080:8080 --init openwa/wa-automate -w https://webhook.site.... --socket
```

See here for more information on [cli flags - https://github.com/open-wa/wa-automate-nodejs/blob/82ecae471e9cdf0013b81f53c2f83d2b33d6fa42/src/cli/setup.ts#L27](https://github.com/open-wa/wa-automate-nodejs/blob/82ecae471e9cdf0013b81f53c2f83d2b33d6fa42/src/cli/setup.ts#L27)
