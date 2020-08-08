# Detecting Logouts

First use [[onStateChanged]] to detect changes in the session state. Then use [[forceRefocus]] to force the the app to continue working. If `state` equals `UNPAIRED` that means the host account user has manually de authenticated the session through the app.

```javascript

  client.onStateChanged(state=>{
    console.log('statechanged', state)
    if(state==="CONFLICT" || state==="UNLAUNCHED") client.forceRefocus();

    if(state==='UNPAIRED') console.log('LOGGED OUT!!!!')
  });


```
