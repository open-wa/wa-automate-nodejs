const { SocketClient } = require('../dist/index.js')

const EASY_API_ADDR = "http://localhost:8060"

const TEST_NUM = "447858117129@c.us"

const test = async () => {
    console.log('Starting')
    const sc = await SocketClient.connect(EASY_API_ADDR)
    console.log(`Client Connected:`, sc.socket.id)
    await sc.onAnyMessage(m=>console.log('ANY', m.body))
    await sc.sendText(TEST_NUM, 'Socket test').then(console.log)
    try {
        const collectedMessages = await sc.awaitMessages(TEST_NUM,m=>m.body==="test",{
            time: 10 * 1000,
            max: 1,
            errors: ["time"]
        })
        console.log(`Collected Messages:`, collectedMessages.first())
    } catch (error) {
        console.log(error)
    }
}

test()