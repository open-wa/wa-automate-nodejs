"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Collector = exports.Collection = void 0;
const collection_1 = require("@discordjs/collection");
const events_1 = require("events");
class Collection extends collection_1.Collection {
    toJSON() {
        return this.map((e) => (typeof e.toJSON === 'function' ? e.toJSON() : e));
    }
}
exports.Collection = Collection;
class Collector extends events_1.EventEmitter {
    constructor(filter, options = {}) {
        super();
        this._timeouts = new Set();
        this._intervals = new Set();
        this._immediates = new Set();
        this.filter = filter;
        this.options = options;
        this.collected = new Collection();
        this.ended = false;
        this._timeout = null;
        this._idletimeout = null;
        this.handleCollect = this.handleCollect.bind(this);
        this.handleDispose = this.handleDispose.bind(this);
        if (options.time)
            this._timeout = this.setTimeout(() => this.stop('time'), options.time);
        if (options.idle)
            this._idletimeout = this.setTimeout(() => this.stop('idle'), options.idle);
    }
    async handleCollect(...args) {
        const collect = this.collect(...args);
        if (collect && (await this.filter(...args, this.collected))) {
            this.collected.set(collect, args[0]);
            this.emit('collect', ...args);
            if (this._idletimeout) {
                this.clearTimeout(this._idletimeout);
                this._idletimeout = this.setTimeout(() => this.stop('idle'), this.options.idle);
            }
        }
        this.checkEnd();
    }
    async handleDispose(...args) {
        if (!this.options.dispose)
            return;
        const dispose = this.dispose(...args);
        if (!dispose || !(await this.filter(...args)) || !this.collected.has(dispose))
            return;
        this.collected.delete(dispose);
        this.emit('dispose', ...args);
        this.checkEnd();
    }
    get next() {
        return new Promise((resolve, reject) => {
            if (this.ended) {
                reject(this.collected);
                return;
            }
            const cleanup = () => {
                this.removeListener('collect', onCollect);
                this.removeListener('end', onEnd);
            };
            const onCollect = item => {
                cleanup();
                resolve(item);
            };
            const onEnd = () => {
                cleanup();
                reject(this.collected);
            };
            this.on('collect', onCollect);
            this.on('end', onEnd);
        });
    }
    stop(reason = 'user') {
        if (this.ended)
            return;
        if (this._timeout) {
            this.clearTimeout(this._timeout);
            this._timeout = null;
        }
        if (this._idletimeout) {
            this.clearTimeout(this._idletimeout);
            this._idletimeout = null;
        }
        this.ended = true;
        this.emit('end', this.collected, reason);
    }
    resetTimer({ time, idle } = {
        time: null,
        idle: null
    }) {
        if (this._timeout) {
            this.clearTimeout(this._timeout);
            this._timeout = this.setTimeout(() => this.stop('time'), time || this.options.time);
        }
        if (this._idletimeout) {
            this.clearTimeout(this._idletimeout);
            this._idletimeout = this.setTimeout(() => this.stop('idle'), idle || this.options.idle);
        }
    }
    checkEnd() {
        const reason = this.endReason();
        if (reason)
            this.stop(reason);
    }
    async *[Symbol.asyncIterator]() {
        const queue = [];
        const onCollect = item => queue.push(item);
        this.on('collect', onCollect);
        try {
            while (queue.length || !this.ended) {
                if (queue.length) {
                    yield queue.shift();
                }
                else {
                    await new Promise(resolve => {
                        const tick = () => {
                            this.removeListener('collect', tick);
                            this.removeListener('end', tick);
                            return resolve(true);
                        };
                        this.on('collect', tick);
                        this.on('end', tick);
                    });
                }
            }
        }
        finally {
            this.removeListener('collect', onCollect);
        }
    }
    collect(...args) {
        throw new Error("abstractMethod not implemented");
    }
    dispose(...args) {
        throw new Error("abstractMethod not implemented");
    }
    endReason(...args) {
        throw new Error("abstractMethod not implemented");
    }
    clearTimeout(timeout) {
        clearTimeout(timeout);
        this._timeouts.delete(timeout);
    }
    setInterval(fn, delay, ...args) {
        const interval = setInterval(fn, delay, ...args);
        this._intervals.add(interval);
        return interval;
    }
    clearInterval(interval) {
        clearInterval(interval);
        this._intervals.delete(interval);
    }
    setImmediate(fn, ...args) {
        const immediate = setImmediate(fn, ...args);
        this._immediates.add(immediate);
        return immediate;
    }
    clearImmediate(immediate) {
        clearImmediate(immediate);
        this._immediates.delete(immediate);
    }
    incrementMaxListeners() {
        const maxListeners = this.getMaxListeners();
        if (maxListeners !== 0) {
            this.setMaxListeners(maxListeners + 1);
        }
    }
    decrementMaxListeners() {
        const maxListeners = this.getMaxListeners();
        if (maxListeners !== 0) {
            this.setMaxListeners(maxListeners - 1);
        }
    }
    setTimeout(fn, delay, ...args) {
        const timeout = setTimeout(() => {
            fn(...args);
            this._timeouts.delete(timeout);
        }, delay);
        this._timeouts.add(timeout);
        return timeout;
    }
    destroy() {
        for (const t of this._timeouts)
            this.clearTimeout(t);
        for (const i of this._intervals)
            this.clearInterval(i);
        for (const i of this._immediates)
            this.clearImmediate(i);
        this._timeouts.clear();
        this._intervals.clear();
        this._immediates.clear();
    }
}
exports.Collector = Collector;
//# sourceMappingURL=Collector.js.map