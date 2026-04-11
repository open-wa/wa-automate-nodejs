#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
    const args = {
        workspace: process.cwd(),
        mode: 'post-code',
        title: 'Review Request',
        scope: '',
        requirement: '',
        out: '.switchboard/handoff'
    };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--workspace' && argv[i + 1]) args.workspace = path.resolve(argv[++i]);
        else if (a === '--mode' && argv[i + 1]) args.mode = argv[++i];
        else if (a === '--title' && argv[i + 1]) args.title = argv[++i];
        else if (a === '--scope' && argv[i + 1]) args.scope = argv[++i];
        else if (a === '--requirement' && argv[i + 1]) args.requirement = argv[++i];
        else if (a === '--out' && argv[i + 1]) args.out = argv[++i];
    }
    return args;
}

const args = parseArgs(process.argv.slice(2));
const outDir = path.resolve(args.workspace, args.out);
fs.mkdirSync(outDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const base = args.mode === 'pre-code' ? `challenge_batch_${stamp}.md` : `audit_request_${stamp}.md`;
const outPath = path.join(outDir, base);

const content = args.mode === 'pre-code'
    ? `# ${args.title}\n\nYou are a Red Team Architect. Break this plan.\n\n## Scope\n${args.scope || '(provide scope paths)'}\n\n## Goal\nFind 3-5 critical flaws, edge cases, or assumptions.\n\n## Output\n- Save report to \`.switchboard/handoff/challenge_report_${stamp}.md\`\n- Send \`submit_result\` with report path.\n`
    : `# ${args.title}\n\nAudit this implementation assuming defects exist.\n\n## Scope\n${args.scope || '(provide modified file paths)'}\n\n## Requirement\n${args.requirement || '(provide target behavior)'}\n\n## Reviewer Checklist\n- Restate requirements\n- List assumptions\n- Identify failure modes\n- Challenge edge cases\n- Rank findings: CRITICAL / MAJOR / MINOR\n- Confidence score (1-10)\n\n## Output\n- Save report to \`.switchboard/handoff/audit_report_${stamp}.md\`\n- Send \`submit_result\` with report path.\n`;

fs.writeFileSync(outPath, content, 'utf8');
console.log(JSON.stringify({
    ok: true,
    mode: args.mode,
    file: path.relative(args.workspace, outPath).replace(/\\/g, '/')
}, null, 2));

