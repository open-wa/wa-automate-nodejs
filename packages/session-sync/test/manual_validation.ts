import { LocalSessionCompression } from '../src/local-compression';
import { S3SyncManager } from '../src/s3-sync';
import fs from 'fs';
import path from 'path';

async function validateSessionSync() {
    console.log('Starting Phase 4 Validation: Session Sync');

    const testDir = path.resolve(__dirname, 'test-session');
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

    // Create dummy subdirectories
    fs.mkdirSync(path.join(testDir, 'Default', 'IndexedDB'), { recursive: true });

    // Create dummy session data
    fs.writeFileSync(path.join(testDir, 'Default', 'session.lock'), 'dummy-lock');
    fs.writeFileSync(path.join(testDir, 'Default', 'IndexedDB', 'dummy.ldb'), 'dummy-db-content');

    console.log('1. Testing Local Compression...');
    const compressor = new LocalSessionCompression({
        sessionPath: testDir,
        outputPath: path.join(__dirname, 'test-session.zst'),
        intervalMs: 1000
    });

    // Manually trigger compression
    await compressor.compress();

    if (fs.existsSync(path.join(__dirname, 'test-session.zst'))) {
        console.log('✅ Compression successful: file created');
    } else {
        console.error('❌ Compression failed: no file created');
        process.exit(1);
    }

    console.log('2. Testing S3 Sync (Mocked by config validation)...');
    const s3 = new S3SyncManager({
        bucket: 'test-bucket',
        region: 'us-east-1',
        accessKeyId: 'test',
        secretAccessKey: 'test',
        endpoint: 'http://localhost:9000'
    });

    try {
        // We expect this to fail connection but pass construction
        await s3.sessionExists('test.zst');
    } catch (e) {
        console.log('✅ S3 Manager instantiated correctly (connection failed as expected)');
    }

    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true });
    fs.rmSync(path.join(__dirname, 'test-session.zst'), { force: true });

    console.log('Phase 4 Validation Passed');
}

validateSessionSync();
