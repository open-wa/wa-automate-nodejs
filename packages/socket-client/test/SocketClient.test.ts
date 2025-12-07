import { Message } from "@open-wa/wa-automate-types-only";
import { SocketClient } from "../src/index";
import { config } from "./config"; // Make sure to create a 'config.ts' file with your open-wa API URL and any necessary API key

jest.setTimeout(30000); // Increase the Jest timeout for these tests, as they involve network communication

let client;

describe("SocketClient", () => {

  beforeAll(async () => {
    client = await SocketClient.connect(config.API_URL, config.API_KEY);
  });

  test("should connect to the open-wa API", () => {
    expect(client).toBeTruthy();
  });

  test("should register an onMessage listener", async () => {
    const listenerId = await client.listen("onMessage", (message) => {
      console.log("Received message:", message);
    });
    expect(listenerId).toBeTruthy();
  });

  test("should send a text message", async () => {
    const to = config.TEST_NUM; // Replace this with a valid phone number (with country code) and WhatsApp user ID
    const content = "Test message from Jest";

    const result = await client.ask("sendText", {
      to,
      content,
    });

    expect(result).toBeTruthy();
  });
});


// Add this test to your 'SocketClient' describe block
test("should not emit onMessage listener twice upon reconnection", async () => {
  const to = config.TEST_NUM; // Replace this with a valid phone number (with country code) and WhatsApp user ID
  const content = "Test message for reconnection";

  let receivedMessageCount = 0;

  const listenerId = await client.listen("onAnyMessage", (message: Message) => {
    if (message.body === content) {
      receivedMessageCount++;
    }
  });

  // Send a message to trigger the onMessage listener
  await client.ask("sendText", {
    to,
    content,
  });

  // Wait for the message to be received
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Simulate a reconnection event
  client.disconnect();
  await client.reconnect();

  // Send the message again to trigger the onMessage listener after reconnection
  await client.ask("sendText", {
    to,
    content,
  });

  // Wait for the message to be received
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Check if the onMessage listener was called exactly two times
  expect(receivedMessageCount).toBe(2);

  // Remove the listener
  client.stopListener("onAnyMessage", listenerId);
});


// test("Should close the socket and allow process to exit", async () => {
//   await client.close();
//   expect(client.socket.connected).toBe(false);
// })