import type { Context } from 'hono';
import { getAuth } from '@firebase/auth';
import { authenticateInstance } from '../watcher/firebase_auth';

export async function forceReauthenticateOrchServer(c: Context) {
  try {
    await getAuth().currentUser?.reload();
  } catch (error) {
    return c.json({ success: false, error });
  }

  if (!getAuth().currentUser) {
    try {
      await authenticateInstance();
    } catch (error) {
      return c.json({ success: false, error });
    }
  }

  if (getAuth().currentUser) {
    return c.json({ success: getAuth()?.currentUser?.uid || '' });
  }

  return c.json({ success: false });
}

export async function reloadOrchAuth(c: Context) {
  try {
    await getAuth().currentUser?.reload();
  } catch (error) {
    return c.json({ success: false, error });
  }

  if (getAuth().currentUser) {
    return c.json({ success: getAuth()?.currentUser?.uid || '' });
  }

  return c.json({ success: false });
}