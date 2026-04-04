const test = require('ava');

const origin = 'http://localhost:3000' 
const api_access_token = ''

const adminReq = async (method, path, data, _headers) => {
    const url = `${origin}/${path}`
    const res = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            api_access_token,
            ..._headers
        },
        ...(data ? { body: JSON.stringify(data) } : {})
    })
    return { data: await res.json() }
}


//should start up
test('should start up', async t => {
    const {data} = await adminReq('get', '/list')
    console.log("🚀 ~ file: index.js ~ line 25 ~ data", data)
    t.pass();
});

//should return the right bucket id
test('should return the right bucket id', async t => {
    const correct_bucket_id = 'fruity-keys-lick'
    const {data} = await adminReq('get', '/list')
    const bucket_id = data[0].id
    console.log("🚀 ~ file: index.js ~ line 35 ~ data", data)
    t.pass();
});

//should return the right user id

//should create a new session (with sessionData injected)

//should return the right session id

//should error out when using admin session id

//should error out when using invalid session id

//should error out when using a pre-existing session ID

//should successfully "STOP" when a session is manually killed using the `/kill` endpoint

//should not allow a new session to squat on the first session's port

//should reject a request going to the wrong session ID //not sure how you're going to test this. Just note it down

//listen to pm2 events //do this by checking the process state of a process is stoppped when the process is stopped

//a deleted session should not automatically reauthenticate

//session should be stopped after x amount of qr attempts

//create session with the previous session data

//stop all pm2 processes & pm2 purge everything. restart admin - check if the previous sessions comes back up