
import { create, ev } from '@open-wa/core';
import { APILifecycleManager } from './server/lifecycle-manager';
import { Config } from '@open-wa/schema';

// Minimal CLI entry point for EZQR testing
async function start() {
    const sessionId = 'session';
    const config: any = {
        sessionId,
        disableSpins: true,
        // Add other necessary config defaults
        apiLifecycle: 'hybrid', // Enable EZQR
        port: 8002, // Default port
        host: '0.0.0.0',
        socketMode: true
    };

    // Initialize API Lifecycle Manager (starts Hono server)
    const lifecycleManager = new APILifecycleManager(config as Config);
    await lifecycleManager.initialize();

    // Listen for QR codes from Core and update the server
    ev.on(`qr.${sessionId}`, (data: string) => {
        console.log('CLI: Recieved QR Code update');
        lifecycleManager.onQRUpdate(data);
    });

    // Provide feedback for other QR events if needed
    ev.on(`qrData.${sessionId}`, () => {
        // console.log('CLI: Raw QR Data received');
    });

    // Start the Core Client
    console.log('Starting WhatsApp Client...');
    const client = await create(config);

    // When connected, notify lifecycle manager
    // Note: create() awaits connection usually, unless eventMode is on?
    // But strictly speaking, we want to know when it is connected.
    // client.isConnected() ?

    if (await client.isConnected()) {
        await lifecycleManager.onSessionConnected();
    }
}

start().catch(err => {
    console.error('Failed to start:', err);
    process.exit(1);
});
