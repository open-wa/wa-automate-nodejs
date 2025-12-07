import pm2, { ProcessDescription } from 'pm2'
import { log } from './logging';

export type TimeoutPromise = (s: number) => Promise<void>;

export const timeout: TimeoutPromise = async (s: number) => new Promise(res => setTimeout(res, s * 1000));

export const timeoutBetweenSessionReloads = 10;

export async function getProcessDescriptions(processId: string): Promise<ProcessDescription[]> {
    return new Promise((resolve, reject) => pm2.describe(processId, (err, data) => {
        if (err) reject(err);
        resolve(data as ProcessDescription[]);
    }))
}

export async function getPortForPm2Process(processId: string): Promise<number | false> {
    return new Promise((resolve, reject) => pm2.describe(processId, (err, data) => {

        if (err) reject(err);
        const env = (data[0]?.pm2_env as any);
        resolve(env ? env['port'] || env['PORT'] || false : false);
    }))
}

export async function getPm2ProcessID(processId: string): Promise<number | undefined> {
    return new Promise((resolve, reject) => pm2.describe(processId, (err, data) => {
        if (err) reject(err);
        resolve(data[0]?.pm_id)
    }))
}

export async function requestPortReport(processId: string) : Promise<{port: number} | false | undefined> {
    try {
        const pm2ProcessId = await getPm2ProcessID(processId);
        if (pm2ProcessId) {
        /**
         * Check if process is alive.
         */
            const procDesc = await getProcessDescriptions(processId);
            const procStatus = procDesc[0] && procDesc[0].pm2_env?.status && `${procDesc[0].pm2_env?.status}`.toLowerCase()
            if (procStatus && procStatus === "online") {
                /**
                 * The process is online and can be asked for a port
                 */
                /**
                 * This promise responds with {port: 1234}
                 */
                return await new Promise((resolve, reject) => {
                    pm2.sendDataToProcessId(pm2ProcessId, {
                        type: 'process:msg',
                        data: {
                            "command": "port_report"
                        },
                        topic: "orch_management"
                    },
                        function (err, res) {
                            if (err) return reject(err);
                            return resolve(res)
                        });
                })
                return false;
            } else {
                log.error(`Port report attempt failed: ${processId} ${pm2ProcessId} ${procStatus}`)
            }
        }
    } catch (error) {
        log.error(error);
        return false;
    }
}

/**
 * Sometimes port assignments are returned as string which makes equality checking a nightmare
 * 
 * This function ensures that a given port is returned as a number.
 * 
 * @param port the port that needs to be santized
 * @returns 
 */
export function portSanitizer(port: string | number): number {
    return Number(`${port}`.trim())
}

/**
 * Checks if two ports are the same
 * 
 * @param a A port string or number
 * @param b Another port string or number
 * @returns 
 */
export function portEqualityChecker(a: string | number, b: string | number): boolean {
    return portSanitizer(a) === portSanitizer(b)
}