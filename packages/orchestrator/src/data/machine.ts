import { machineIdSync } from 'node-machine-id';
import { log } from "../utils/logging";

export const getMachineId : () => string = () => {
    const id = machineIdSync(true);
    log.info('Machine ID: ', id);
    return id;
}