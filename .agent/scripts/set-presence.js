#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
    const args = {
        workspace: process.cwd(),
        agent: '',
        status: '',
        message: ''
    };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--workspace' && argv[i + 1]) args.workspace = path.resolve(argv[++i]);
        else if (a === '--agent' && argv[i + 1]) args.agent = argv[++i];
        else if (a === '--status' && argv[i + 1]) args.status = argv[++i];
        else if (a === '--message' && argv[i + 1]) args.message = argv[++i];
    }
    return args;
}

const args = parseArgs(process.argv.slice(2));
if (!args.agent || !args.status) {
    console.error('Usage: node .agent/scripts/set-presence.js --agent <name> --status <standby|active|away|working|thinking|idle|error|planning> [--message "..."] [--workspace <path>]');
    process.exit(1);
}

const sbDir = path.join(args.workspace, '.switchboard');
const statePath = path.join(sbDir, 'state.json');
const inboxDir = path.join(sbDir, 'inbox', args.agent);
fs.mkdirSync(inboxDir, { recursive: true });

let state = {};
if (fs.existsSync(statePath)) {
    try {
        state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    } catch {
        state = {};
    }
}

if (!state.chatAgents) state.chatAgents = {};
if (!state.terminals) state.terminals = {};

const now = new Date().toISOString();
const status = args.status;
const message = args.message || null;

if (state.terminals[args.agent]) {
    state.terminals[args.agent].statusState = status;
    state.terminals[args.agent].statusMessage = message;
    state.terminals[args.agent].statusUpdatedAt = now;
} else {
    const existing = state.chatAgents[args.agent] || {};
    state.chatAgents[args.agent] = {
        type: 'chat',
        interface: existing.interface || 'unknown',
        role: existing.role || undefined,
        status,
        statusMessage: message,
        activeWorkflow: existing.activeWorkflow || null,
        currentStep: existing.currentStep || 0,
        activePersona: existing.activePersona || null,
        capabilities: existing.capabilities || ['chat'],
        friendlyName: existing.friendlyName || args.agent,
        icon: existing.icon || 'comment-discussion',
        color: existing.color || 'purple',
        registeredAt: existing.registeredAt || now,
        lastSeen: now
    };
}

fs.mkdirSync(path.dirname(statePath), { recursive: true });
fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
console.log(JSON.stringify({
    ok: true,
    agent: args.agent,
    status,
    statePath: path.relative(args.workspace, statePath).replace(/\\/g, '/')
}, null, 2));

