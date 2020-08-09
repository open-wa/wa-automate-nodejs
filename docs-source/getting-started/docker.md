# Docker

There are a few ways to use this library in docker.

1. Using the default quick run API dockerized
2. Runing your custom app built on top of this library dockerized.

Either way, we must remember the whole point of containerization is for each unit/process to have a single purpose. For this reason, the browser process & wa-automate process are seperate.

Both methods are explained in the [`@open-wa/wa-automate-docker`](https://github.com/open-wa/wa-automate-docker) repository.