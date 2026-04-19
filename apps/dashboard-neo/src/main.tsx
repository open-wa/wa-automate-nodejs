import React from "react"
import ReactDOM from "react-dom/client"
import { RouterProvider } from "@tanstack/react-router"
import { getRouter } from "./router"

import "./styles.css"

const router = getRouter()

// Initialize WebMCP natively
if (typeof navigator !== 'undefined' && 'modelContext' in navigator) {
  (navigator as any).modelContext?.provideContext({
    tools: [{
      name: "get_open_wa_health",
      description: "Retrieves the session state status",
      inputSchema: { type: "object", properties: {} },
      execute: async () => {
        try {
          const res = await fetch('/health');
          return await res.json();
        } catch (e: any) {
          return { error: e.message || 'Failed to fetch health' };
        }
      }
    }]
  });
}

ReactDOM.createRoot(document.getElementById("app")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
