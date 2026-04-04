import { tunnel } from "cloudflared";
import { log } from "../..";

export const createCustomDomainTunnel: (cliConfig, PORT: number) => Promise<{
    url: string;
    connections: Promise<any>[];
    child: any;
    stop: () => Promise<void>;
}> = async (cliConfig, PORT: number) => {
    const {cfTunnelHostDomain, sessionId, cfTunnelNamespace} = cliConfig;
    const sessionName = sessionId.replace(/[^A-Z0-9]/ig, "_").toLowerCase();
    const tunnelName = `_owa_${sessionName}`
    const FQDN = `${sessionName}${cfTunnelNamespace ? `.${cfTunnelNamespace}` : `_owa`}.${cfTunnelHostDomain}`
    const hostname = `https://${FQDN}`
    const target = `http://localhost:${PORT}`
    const logData = (data) => log.info(`CLOUDFLARE TUNNEL: ${typeof data === "object" ? Buffer.isBuffer(data) ? data.toString() : JSON.stringify(data,null,2) : data}`);
    // simlpe helper function to convert child proc to a promise and log the output
    const cfp = (child) => {
        return new Promise((resolve, reject) => {
            child.stdout?.on('data', logData);
            child.stderr?.on('data', logData);
            child.on('error', reject);
            child.on('exit', (code) => {
                if (code === 0) {
                    resolve(true);
                } else {
                    reject(`Exit code: ${code}`);
                }
            });
        });
    }
    log.info(`Checking if tunnel ${tunnelName} exists...`)
    const tunnelExists = await new Promise((resolve) => {
        const check = (data) => {
            logData(data.toString())
            return resolve(!data.toString().includes("error"))
        }
        const {child} = tunnel({ "info": tunnelName })
        child.stdout.once('data', check)
        child.stderr.once('data', check)
    });
    if (!tunnelExists) {
        log.info("Tunnel does not exist, creating...")
        await cfp(tunnel({ "create": tunnelName }).child);
    }
    log.info(`Routing traffic to the tunnel via URL ${FQDN}...`)
    await cfp(tunnel({ "route": "dns", "--overwrite-dns": null, [tunnelName]: FQDN }).child)
    const { connections, child, stop } = tunnel({
        "--url": target,
        "--hostname": hostname,
        "run": tunnelName
    })
    child.stdout.on('data', logData)

    // wait for the all 4 connections to be established
    const conns = await Promise.all(connections);
    // show the connections
    log.info(`Connections Ready! ${JSON.stringify(conns, null, 2)}`)

    return {
        url: hostname,
        connections,
        child,
        stop: async () => {
            stop();
            await cfp(tunnel({ "delete": tunnelName }).child)
        }
    }
}