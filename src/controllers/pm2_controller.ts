//Watches ovrer the PM2 process
import pm2 from "pm2";
import { bucket } from "../data/bucket";
import { stopProcess } from "../endpoints/stop";
import { log } from "../utils/logging";

class StopManager {
  validStopReasons = [
    "PAGE_CLOSED",
    "LOGGED_OUT",
    "MANUALLY_KILLED",
    "PAGE_CLOSED",
    "QR_LIMIT_REACHED",
  ]
  forceStop = {
    "example":true
  }

  latestValidStopReason = {
    "example-session": "PAGE_CLOSED"
  }

  preventAutoStop(sessionId: string) {
    this.forceStop[sessionId] = false;
  }

  autoStop(sessionId: string, reason?: string) {
    this.forceStop[sessionId] = now();
    if(reason) this.latestValidStopReason[sessionId] = reason
  }

  shouldAutoStop(sessionId: string) {
    return this.forceStop[sessionId] && !stale(this.forceStop[sessionId]);
  }

  getStopReason(sessionId: string) {
    return this.latestValidStopReason[sessionId]
  }

}

export const stopManager = new StopManager();


// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function startPm2ProcessWatcher() {
  return pm2.launchBus(function (err, pm2_bus) {
    if (err) {
      log.error("Couldn't connect to the PM2 BUS", err);
      return;
    }
    //connected to the pm2 message bus
    pm2_bus.on("*", async function (event: string, packet: any) {
      if (packet.process.name == 'admin') return;

      if (event.startsWith("process:event")) {
        if(packet.event == "online" && stopManager.shouldAutoStop(packet.process.name)){
          /**
           * If this process is coming from a process that is meant to be force stopped then stop it.
           */
          log.info("This session is erroneously back onine. Stopping it", packet.process.name)
          await stopProcess(packet.process.name, stopManager.getStopReason(packet.process.name) || "KEEPING_STOPPED")
          stopManager.preventAutoStop(packet.process.name)
        } else
        //this packet is related to a valid process event
        await bucket?.processPm2ProcessEvent(packet);
      } 
      else if (event.startsWith("log:err")) {
        // console.log("🚀 ~ file: pm2_controller.ts ~ line 15 ~ packet", packet.process.name, packet.data)
        if (packet.data.includes("QR Code limit reached")) {
          log.info("MAX QR REACHED. Stopping session!", packet.process.name)
          stopManager.autoStop(packet.process.name)
          await stopProcess(packet.process.name, "QR_LIMIT_REACHED")
          // await bucket?.sessions.get(packet.process.name)?.stop("QR_LIMIT_REACHED")
        }
      }
      else if (event.startsWith("process:msg")) {
        if(packet?.data?.reason && stopManager.validStopReasons.includes(packet.data.reason)){
          log.info("PM2 MSG: STOPPING SESSION", packet, packet.process.name)
          stopManager.autoStop(packet.process.name, packet.data.reason)
          // await bucket?.sessions.get(packet.process.name)?.stop(packet.data.reason || "QR_LIMIT_REACHED")
          await stopProcess(packet.process.name, packet.data.reason)
        } else if(packet?.data?.port) {
          log.info("PM2 MSG: PORT REPORT", packet.process.name, packet.data.port)
          await bucket?.sessions.get(packet.process.name)?.updatePort(packet.data.port)
        }
      }
    });
  });
}

const now = () => Date.now();

/**
 * 
 * A timestamp is considered stale if it is older than 15 seconds.
 * 
 * @param time The timestamp to check
 * @returns 
 */
const stale = (time: number) => {
  return (Date.now() - time) / 1000 > 15
}
