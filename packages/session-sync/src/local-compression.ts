import chokidar from 'chokidar';
import tar from 'tar-fs';
const zstd = require('simple-zstd');
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

export interface CompressionOptions {
    sessionPath: string;
    sessionId: string;
    outputPath?: string; // Defaults to sessionPath/session.data.zst
    intervalMs?: number; // Throttle interval, default 10 mins (600000ms)
}

export class LocalSessionCompression extends EventEmitter {
    private watcher: any = null;
    private isCompressing: boolean = false;
    private lastCompressionTime: number = 0;
    private throttleTimer: NodeJS.Timeout | null = null;
    private config: CompressionOptions;

    constructor(config: CompressionOptions) {
        super();
        this.config = config;
        this.config.intervalMs = this.config.intervalMs || 600000;
    }

    public start() {
        if (this.watcher) return;

        // Watch for changes in the directory
        // We ignore existing .zst files to prevent infinite loops
        this.watcher = chokidar.watch(this.config.sessionPath, {
            ignored: /(^|[\/\\])\..|.*\.zst$/,
            persistent: true,
            awaitWriteFinish: {
                stabilityThreshold: 2000,
                pollInterval: 100
            }
        });

        this.watcher.on('add', () => this.scheduleCompression());
        this.watcher.on('change', () => this.scheduleCompression());
        this.watcher.on('unlink', () => this.scheduleCompression());

        console.log(`Session compression started for: ${this.config.sessionPath}`);
    }

    public stop() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
        if (this.throttleTimer) {
            clearTimeout(this.throttleTimer);
            this.throttleTimer = null;
        }
    }

    private scheduleCompression() {
        if (this.isCompressing) return;

        const now = Date.now();
        const timeSinceLast = now - this.lastCompressionTime;

        if (timeSinceLast >= (this.config.intervalMs || 600000)) {
            this.compress();
        } else {
            if (!this.throttleTimer) {
                const waitTime = (this.config.intervalMs || 600000) - timeSinceLast;
                console.log(`Scheduling compression in ${Math.round(waitTime / 1000)}s`);
                this.throttleTimer = setTimeout(() => {
                    this.compress();
                    this.throttleTimer = null;
                }, waitTime);
            }
        }
    }

    public async compress() {
        if (this.isCompressing) return;
        this.isCompressing = true;

        const outputPath = this.config.outputPath || path.join(path.dirname(this.config.sessionPath), 'session.data.zst');
        const start = Date.now();

        try {
            console.log('Starting compression...');

            const sessionDir = this.config.sessionPath;

            // Ensure output dir exists
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });

            // Create write stream
            const dest = fs.createWriteStream(outputPath);

            // Pack -> Compress -> Write
            const pack = tar.pack(sessionDir);

            // Zstandard compression
            // simple-zstd compress returns a Transform stream
            // @ts-ignore
            const zstdStream = zstd.ZSTDCompress(3); // Level 3 is default, good speed/ratio

            await new Promise<void>((resolve, reject) => {
                pack.pipe(zstdStream).pipe(dest)
                    .on('finish', () => resolve())
                    .on('error', (err: any) => reject(err));
            });

            const size = fs.statSync(outputPath).size;
            const duration = Date.now() - start;
            const metrics = { size, duration, path: outputPath };

            this.lastCompressionTime = Date.now();
            this.emit('compressed', metrics);
            console.log(`Compression complete: ${(size / 1024 / 1024).toFixed(2)}MB in ${duration}ms`);

        } catch (error) {
            console.error('Compression failed:', error);
            this.emit('error', error);
        } finally {
            this.isCompressing = false;
        }
    }
}
