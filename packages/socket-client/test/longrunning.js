const { SocketClient } = require('../dist/index.js')

const EASY_API_ADDR = "http://localhost:8060"

const TEST_NUM = "4477123456789@c.us"

const testAwaitedSocket = async () => {
    console.log('Starting')
    const sc = await SocketClient.connect(EASY_API_ADDR)
    // sc.onConnected(async ()=>{
    // })
    console.log(`Client Connected:`, sc.socket.id)
    await sc.onAnyMessage(m=>console.log('NEW ANY MESSAGE: ', m.text))
    await sc.sendText(TEST_NUM, 'Socket test').then(console.log)
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await sc.disconnect()
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await sc.reconnect()
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await sc.sendText(TEST_NUM, 'Socket test 2').then(console.log)
}

testAwaitedSocket()


const testCallbackSocket = async () => {
    console.log('Starting')
    const sc = new SocketClient(EASY_API_ADDR)
    sc.onConnected(async ()=>{
        console.log(`Client Connected:`, sc.socket.id)
        await sc.onAnyMessage(m=>console.log('NEW ANY MESSAGE: ', m.text))
        await sc.sendText(TEST_NUM, 'Socket test').then(console.log)
        await sc.sendText(TEST_NUM, 'Socket test 2').then(console.log)
    })
}

// testCallbackSocket()