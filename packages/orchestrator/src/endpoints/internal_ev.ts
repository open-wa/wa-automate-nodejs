// import pm2 from 'pm2'
// import { Request, Response } from "express";
// import { proxyRegistry } from "./proxy";

// export const _reloadAll: () => Promise<{
//   reloads: void[];
//   errors: Error[];
// }> = async () => {
//   const errors: Error[] = [];
//   const reloads = await Promise.all(Object.keys(proxyRegistry).map(sessionId => pm2.reload(sessionId, x => {
//     log.error(x);
//     errors.push(x)
//   })))
//   return {
//     reloads,
//     errors
//   }
// }

// // export const commitEvMessage: (sessionId: string, evMessage: string) => 

// // export const reload : (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>=  async (req: Request, res: Response) => {
// //   const {sessionId} = req.body;
// //   if(sessionId==='admin') return res.send({
// //     success: false,
// //     sessionId,
// //     message: 'You cannot use admin'
// //   })
// //    try {
// //     if(!proxyRegistry[sessionId]) return res.send(`${sessionId} not running`);
// //     await pm2.reload(sessionId, x=>{
// //       log.info(x);
// //     })
// //     return res.send({
// //      success: true,
// //      sessionId,
// //      message: `reloaded: ${sessionId}`
// //    });
// //    } catch (error : any) {
// //     return res.send({
// //       success: false,
// //       sessionId,
// //       message: error?.message || error || '??'
// //     });
// //    }
// //  }