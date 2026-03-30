import pidtree from 'pidtree';
import pidusage from 'pidusage';

type PidStat = { cpu: number; memory: number; ppid: number; pid: number; ctime: number; elapsed: number; timestamp: number };

export const pidTreeUsage = async (pid: number | number[]): Promise<{ [key: string]: PidStat } | Record<string, never>> => {
    let pidArray = Array.isArray(pid) ? pid : [pid];
    try {
        const pids: number[] = (await Promise.all(pidArray.map(p => pidtree(p)))).flat() as number[];
        // Include the original pids in the list for measurement
        const allPids = Array.from(new Set([...pidArray, ...pids]));
        const stats = await pidusage(allPids);
        return stats;
    } catch (error) {
        console.error('Error fetching PID tree usage:', error);
        return {};
    }
};
