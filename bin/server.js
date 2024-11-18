#! /usr/bin/env node
const pm2Index = process.argv.findIndex(arg => arg === "--pm2");
const sIdIndex = process.argv.findIndex(arg => arg === "--session-id");
const nameIndex = process.argv.findIndex(arg => arg === "--name");
const getVal = (index) => index !== -1 && process.argv[index + 1]
const getBool = (index) => !((index !== -1 && process.argv[index + 1]) === false)
const procName = getVal(sIdIndex || nameIndex) || "@OPEN-WA EASY API";
const CLI = '../dist/cli'
async function start() {
    if (getBool(pm2Index)) {
        const { spawn } = require("child_process");
        try {
            const pm2 = spawn('pm2');
            await new Promise((resolve, reject) => {
                pm2.on('error', reject);
                pm2.stdout.on('data', () => resolve(true));
            })
            const stringedArgs = (getVal(pm2Index) || "").match(/"[^"]*"/g);
            let pm2ArgString = (getVal(pm2Index) || "");
            if(stringedArgs) stringedArgs.map(stringedArg => pm2ArgString = pm2ArgString.replace(stringedArg, stringedArg.replaceAll(" ","|~|")))
            const pm2Flags = pm2ArgString.split(" ").map(r=>r.replaceAll("|~|"," ")).flatMap(r=>r.split("=")).map(r=>r.replaceAll('"',"")).filter(x=>x);
            const cliFlags = (process.argv.slice(2) || []);
            spawn("pm2", [
                "start",
                require.resolve(CLI),
                '--name',
                procName,
                '--stop-exit-codes',
                '88',
                ...pm2Flags,
                '--',
                ...cliFlags.filter(x=>!pm2Flags.includes(x))
            ], {
                stdio: "inherit",
                detached: true
            })
        } catch (error) {
            if (error.errorno === -2) console.error("pm2 not found. Please install with the following command: npm install -g pm2");
        }
    } else {
        require(CLI);
    }
}

start()