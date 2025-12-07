# @open-wa/wa-orchestrate v1.0.0

Now the droplet is configured 100% correctly. The firewall by default allows 80 and 443 and all requrests are routed from 80 to 3000. The app iteself is running on 3000.

The user that is running the app is called `nodejs`. When you ssh into the machine you will be logged in as root. So in order to interact with the correct pm2 process you have to change user

```bash
> su nodejs
```

Once you've logged in as `nodejs` you can now see the running processes/interact with pm2

```bash
> pm2 monit
```

The app folder is now located at:

```bash
> cd /home/nodejs/admin-api
```

To start the process, inside the above directory, as the user `nodejs`, run:

```bash
> npm run start
```