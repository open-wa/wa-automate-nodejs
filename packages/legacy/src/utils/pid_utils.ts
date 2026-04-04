import pidtree from 'pidtree';
import pidusage from 'pidusage';

export interface PidStat {
  cpu: number;
  memory: number;
  ppid?: number;
  pid?: number;
  ctime?: number;
  elapsed?: number;
  timestamp?: number;
}

export const pidTreeUsage = async (pid: number | number[]): Promise<Record<string, PidStat>> => {
  const pidArray = Array.isArray(pid) ? pid : [pid];
  const pids: number[] = (await Promise.all(pidArray.map((p) => pidtree(p)))).flat() as number[];
  const allPids = [...new Set([...pidArray, ...pids])];
  const stats = await pidusage(allPids);
  return stats as Record<string, PidStat>;
};
