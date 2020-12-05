# open-wa-heroku-deployment

Steps:

0. Make sure you have a .data.json file already authenticatred. If you do not already have this then run this code

```bash
> npx @open-wa/wa-automate -o
```

This will stop the program as soon as a .data.json file has been created (It should be named `session.data.json` and in the same folder from which you ran the CLI)


1. Press the deploy button
2. Enter an API key to protect your API requests. If you do not set this Key then it will automatically generated for you. If it is generated for you, you will have to access the key from the logs.
3. Copy the Base64 encoded string from the `.data.json` file and into the `WA_SESSION_DATA` field.
4. Deploy (should take a few minutes)
5. Open app with the path `/api-docs/`

