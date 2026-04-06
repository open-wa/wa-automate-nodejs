import { useSearch } from "@tanstack/react-router"

/**
 * Returns whether the dashboard is running in demo mode.
 * Activated via ?demo=true in the URL.
 * In demo mode, all data hooks return realistic mock data
 * instead of making live socket/API calls.
 */
export function useDemo(): { isDemo: boolean } {
  const search = useSearch({ from: "__root__" }) as { demo?: boolean }
  return { isDemo: search.demo === true }
}
