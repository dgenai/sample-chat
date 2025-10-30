// server.js
import { webcrypto } from "node:crypto";
if (!globalThis.crypto) globalThis.crypto = webcrypto;

import express from "express";
import cors from "cors";
import compression from "compression";
import bodyParser from "body-parser";
import { config } from "dotenv";
import { PublicApiClient, HttpClient } from "dgenai-sdk";
import { createSigner } from "x402-axios";

config();
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(compression({ level: 0 })); // safe for normal routes

// Environment variables
const API_KEY = process.env.API_KEY || "";
const BASE_URL = process.env.BASE_URL;
const NETWORK = process.env.NETWORK;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Initialize DGENAI client
let api;
async function initClient() {
  const http = new HttpClient({ apiKey: API_KEY, baseUrl: BASE_URL });
  const signer = await createSigner(NETWORK, PRIVATE_KEY);
  api = new PublicApiClient(http, signer, NETWORK, true);
  console.log(`[DGENAI Proxy] Initialized on ${NETWORK}`);
}
await initClient();

/**
 * GET /api/agents
 * Returns the list of available public agents
 */
app.get("/api/agents", async (req, res) => {
  try {
    const agents = await api.listAgents();
    res.json(agents);
  } catch (err) {
    console.error("Failed to fetch agents:", err);
    res.status(500).json({ error: "Failed to list agents" });
  }
});

/**
 * POST /api/ask
 * Body: { agentId, input, userName, userId }
 * Streams real-time SSE responses from DGENAI
 */
app.post("/api/ask", express.json(), async (req, res) => {
  const { agentId, input, userName, userId } = req.body;
  if (!agentId || !input) {
    return res.status(400).json({ error: "Missing agentId or input" });
  }

  try {
    const emitter = api.askAgentAsyncStream(agentId, {
      input,
      userName: userName || "proxy-client",
      userId,
      feePayer: "2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4",
    });

    // SSE headers — critical to disable buffering
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Nginx / proxy
    res.setHeader("Transfer-Encoding", "chunked");
    res.flushHeaders?.();

    // Ensure express doesn't buffer
    res.flush = res.flush || (() => {});

    emitter
      .on("status", (msg) => {
        res.write(`data: ${JSON.stringify({ type: "status", msg })}\n\n`);
        res.flush();
      })
      .on("message", (msg) => {
        res.write(`data: ${JSON.stringify({ type: "message", msg })}\n\n`);
        res.flush();
      })
      .on("payment", (msg) => {
        res.write(`data: ${JSON.stringify({ type: "payment", msg })}\n\n`);
        res.flush();
      })
      .on("done", () => {
        res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
        res.flush();
        res.end();
      })
      .on("error", (err) => {
        console.error("Stream error:", err);
        res.write(
          `data: ${JSON.stringify({ type: "error", msg: String(err) })}\n\n`
        );
        res.flush();
        res.end();
      });
  } catch (err) {
    console.error("askAgentAsyncStream failed:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () =>
  console.log(`🟢 DGENAI Proxy running at http://localhost:${PORT}`)
);
