# Location

## Sending Location

[[sendLocation]]

```javascript
    client.sendLocation(chatId, latitude, longitude, 'London!')
```

## Receiving Location

Check the [[Message]] reference to learn how to extract the coordinates from a location message

```javascript
    client.onMessage(message=> {
        if(message.type==="location") {
            //Using destructuring
            const {
                // The text associated with the location
                loc,
                //Latitude
                lat,
                //Longitude
                lng
            } = message
        }
    })
```

## Listening to Live Locations

[[onLiveLocation]] fires a [[LiveLocationChangedEvent]] event. [[onLiveLocation]] requires a chat id to listen to so you need to detect exactly when a chat starts sharing a live location with your host account. This example detects when a live location is started and then registers a new callback to listen to updates in that live location session.

```javascript
    const liveLocationCallback = currentLiveLocation => {
        console.log('Live location update', currentLiveLocation.id, currentLiveLocation.lat, currentLiveLocation.lng);
    }
    client.onMessage(message=> {
        //This is how to detect when someone has started a live location with you
        if(message.shareDuration){
            client.onLiveLocation(message.from, liveLocationCallback)
        }
    })

```

### Forcing Live Locations to Update

The updates of live locations are very passive. If you require updates at regular intervals then you can force it using [[forceUpdateLiveLocation]]. It is recomended to keep an array of chat ids that have live location sessions and map through them at regular intervals

```javascript
    await client.forceUpdateLiveLocation(chatId);

    //or force update live locations of multiple chats
    await Promise.all([
        'chatId1',
        'chatId2'
    ].map(client.forceUpdateLiveLocation));
```
