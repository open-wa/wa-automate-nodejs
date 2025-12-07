
import { getAuth } from "@firebase/auth";
import { authenticateInstance } from "../watcher/firebase_auth";
import { Request, Response } from "express";

export const forceReauthenticateOrchServer: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>> = async (req : Request, res : Response) => {
    
    try {
        await getAuth().currentUser?.reload();
      } catch (error) {
        return res.status(200).json({success: false, error});
      }
      
    if(!getAuth().currentUser) {
      try {
        await authenticateInstance()
      } catch (error) {
        return res.status(200).json({success: false, error});
      }
    }
    if(getAuth().currentUser) {
        return res.status(200).json({success: getAuth()?.currentUser?.uid || ""})
    } else return res.status(200).json({success: false})
  }


export const reloadOrchAuth: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>> = async (req : Request, res : Response) => {
    try {
        await getAuth().currentUser?.reload();
    } catch (error) {
        return res.status(200).json({success: false, error});
    }
    if(getAuth().currentUser) {
        return res.status(200).json({success: getAuth()?.currentUser?.uid || ""})
    } else return res.status(200).json({success: false})
  }