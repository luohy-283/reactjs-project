import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_API_PROXY_TARGET;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(rootDir, "src"),
      },
    },
    server: {
      // Bind IPv4+IPv6 so http://127.0.0.1:5173 works (Node on Windows often
      // only listens on ::1 when host defaults to "localhost").
      host: true,
      ...(proxyTarget
        ? {
            proxy: {
              "/api": {
                target: proxyTarget,
                changeOrigin: true,
                secure: true,
                headers: {
                  "ngrok-skip-browser-warning": "true",
                },
              },
              "/ws": {
                target: proxyTarget,
                changeOrigin: true,
                secure: true,
                ws: true,
                headers: {
                  "ngrok-skip-browser-warning": "true",
                },
              },
            },
          }
        : {}),
    },
  };
});
