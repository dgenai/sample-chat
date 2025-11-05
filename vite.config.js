import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      stream: path.resolve(__dirname, "node_modules/stream-browserify"),
      crypto: path.resolve(__dirname, "node_modules/crypto-browserify"),
      buffer: path.resolve(__dirname, "node_modules/buffer"),
      util: path.resolve(__dirname, "node_modules/util"),
      process: path.resolve(__dirname, "node_modules/process/browser.js"),
    },
  },
  define: {
    "process.env": {},
    global: "window",
  },
  optimizeDeps: {
    include: [
      "process",
      "util",
      "buffer",
      "stream-browserify",
      "crypto-browserify",
    ],
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      "/api": "http://localhost:5050",
    },
  },
  base: "./",
});
