"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pidTreeUsage = void 0;
const pidtree_1 = __importDefault(require("pidtree"));
const pidusage_1 = __importDefault(require("pidusage"));
const pidTreeUsage = async (pid) => {
    if (!Array.isArray(pid)) {
        pid = [pid];
    }
    const pids = (await Promise.all(pid.map(pidtree_1.default))).flat();
    const stats = await (0, pidusage_1.default)(pids);
    return stats;
};
exports.pidTreeUsage = pidTreeUsage;
//# sourceMappingURL=pid_utils.js.map