import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Same-origin proxy so the browser does not call the remote API directly (avoids CORS). */
const daycareProxy = {
  "/App": {
    target: "https://ab1000.daycareit.ca",
    changeOrigin: true,
    secure: true,
  },
};

export default defineConfig({
  plugins: [react()],
  envPrefix: ["VITE_"],
  server: {
    proxy: daycareProxy,
  },
  preview: {
    proxy: daycareProxy,
  },
});
