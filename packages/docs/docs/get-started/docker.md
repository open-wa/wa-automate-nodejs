---
title: Get started with wa-automate via Docker
sidebar_label: Docker
sidebar_position: 1
description:
  Guide showing how to use wa-automate with Docker. This also covers how to import
  data as well as persistence.
---

open-wa has universal images on
[Docker Hub]({@dockerUrl@}).

## Prerequisites

Make sure you have docker installed on your system and are not using a Apple silicon chip. Due to the lack of an ARM compatibile Google Chrome, the docker container does not run on ARM machines.

## Run the container (EASY API)

You can use the following docker command as a drop-in replacement for the normal CLI command (`npx @open-wa/wa-automate`). This means you can use CLI flags normally right after `docker run openwa/wa-automate`. The below example runs the library in socket mode.

```bash
> docker run openwa/wa-automate --socket
```

The docker image already has some defaults that do not need to be set via additional CLI flags.

## Using the docker image with your own code

You can extend the docker image and use it as a base for your own custom project. This is useful so you don't have to worry about dependencies. The image is optimised and slimmed out to prevent needless bloat.

First thing you need to do is to override the `ENTRYPOINT` of the base docker image by adding the line `ENTRYPOINT []`

```Dockerfile
FROM openwa/wa-automate
ENTRYPOINT []

# Now you can add your custom docker commands
```

After the above, add your custom docker commands to `COPY` your custom code into the image and then `RUN` it at the end.

Both methods are explained in the [`@open-wa/wa-automate-docker`](https://github.com/open-wa/wa-automate-docker) repository.