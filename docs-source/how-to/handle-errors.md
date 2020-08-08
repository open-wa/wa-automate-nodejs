# Error Handling

## Keep your promises!

Treat all `client` methods as promises. Therefore make sure to await them and wrap them in `try/catch` blocks

```javascript
    client.onMessage(async message => {
        try{
            //respond with 'Hi!'
            await client.sendText(message.from, 'Hi!');
        } catch(error){
            console.log(error);
        }
    })

```

## Error handling on `create`

The [[create]] method itself is a promise so you can handle errors using a try catch block here also from which you can choose to try again or exit the process.

```javascript
async function start(client){
    ...
}

async function launch(){
    try{
        const client = await create();
        await start(client);
    } catch(error){
        console.log(errror)
    }
}

launch();

```

Alternatively, you can set the client "start" function (the function that consumes the client after it has been created) as a config variable [[restartOnCrash]], allowing the process itself to restart/retry if there are any issues. Be careful with this as it may lead to an endless loop.

You can also use [[logConsole]] (logs all browser console output) or just [[logConsoleErrors]] (only logs browser errors) to better debug issues.

Setting [[killProcessOnBrowserClose]] to true will kill the whole node process upon any critical browser issue (maybe the browser runs out of memory and crashes, this option will kill the process).

This is useful if you have a n orchestrator process that restarts processes. (e.g [pm2](https://pm2.keymetrics.io/) or a [docker restart policy](https://docs.docker.com/config/containers/start-containers-automatically/#:~:text=Restart%20policy%20details,-Keep%20the%20following&text=A%20restart%20policy%20only%20takes,going%20into%20a%20restart%20loop.))

```javascript
async function start(client){
    ...
}

async function launch(){
    try{
        const client = await create({
            //sets restartOnCrash to the above `start` function
            restartOnCrash: start,

            //log all browser console output
            logConsole: true,

            //or just browser errors
            logConsoleErrors: true,

            //kill the process if the browser crashes/is closed manually
            killProcessOnBrowserClose: true
        });
        await start(client);
    } catch(error){
        console.log(error)
    }
}

launch();
```
