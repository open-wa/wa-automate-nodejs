import pidtree from 'pidtree'
import pidusage from 'pidusage'

export const pidTreeUsage = async pid => {
    if(!Array.isArray(pid)) {
        pid = [pid]
    }
    const pids : number[] = (await Promise.all(pid.map(pidtree))).flat() as number[];
    const stats = await pidusage(pids)
    return stats;
}