#!/usr/bin/env node
import { webcrypto } from "node:crypto";
import express from "express";
import cors from "cors";
import compression from "compression";
import bodyParser from "body-parser";
import { config } from "dotenv";
import { HttpClient, PublicApiClient, createX402Fetch } from "dgenai-sdk";
import { createSigner } from "x402-fetch";

// Enable WebCrypto for Node.js (needed by x402-fetch)
if (!global.crypto) global.crypto = webcrypto;

// Load environment variables
config();
const app = express();

// Middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(compression({ level: 0 }));

// Environment configuration
const API_KEY = process.env.VITE_API_KEY || "";
const BASE_URL = process.env.VITE_BASE_URL;
const NETWORK = process.env.VITE_NETWORK;
const PRIVATE_KEY = process.env.VITE_PRIVATE_KEY;

// Globals
let api;
let lastPaymentHeader = null;

/**
 * Wrap a fetch implementation to capture any payment header
 * (e.g. "X-PAYMENT-RESPONSE" or "x402-payment-proof")
 */
function createFetchWithHeaderCapture(baseFetch) {
  return async (url, options) => {
    const response = await baseFetch(url, options);

    const paymentHeader =
      response.headers.get("X-PAYMENT-RESPONSE");

    // Store the most recent payment proof if it changed
    if (paymentHeader && paymentHeader !== lastPaymentHeader) {
      lastPaymentHeader = paymentHeader;
    }

    return response;
  };
}

/**
 * Initialize DGENAI client and signer
 */
async function initClient() {
  const http = new HttpClient({ apiKey: API_KEY, baseUrl: BASE_URL });

  let signer = null;
  let fetchImpl = global.fetch;

  if (PRIVATE_KEY && NETWORK) {
    signer = await createSigner(NETWORK, PRIVATE_KEY);
    const x402Fetch = createX402Fetch(signer);
    fetchImpl = createFetchWithHeaderCapture(x402Fetch);
    console.log("[DGENAI] Signer + x402Fetch initialized (with header capture)");
  }

  api = new PublicApiClient(http, signer, NETWORK, true, fetchImpl);
  console.log(`[DGENAI Proxy] Ready on network: ${NETWORK}`);
}

await initClient();

/**
 * GET /api/agents
 * Fetch and list all available agents
 */
app.get("/api/agents", async (req, res) => {
  try {
    const agents = await api.listAgents();
    res.json(agents);
  } catch (err) {
    console.error("Error fetching agents:", err);
    res.status(500).json({ error: "Failed to list agents" });
  }
});

/**
 * POST /api/stream
 * Body: { agent, input, metadata? }
 *
 * Creates an SSE (Server-Sent Events) stream for real-time messages
 * and pushes new payment proofs as `event: payment` whenever detected.
 */
app.post("/api/stream", async (req, res) => {
  const { agent, input, metadata } = req.body;
  if (!agent || !input) {
    return res.status(400).json({ error: "Missing 'agent' or 'input'" });
  }

  try {
    const emitter = await api.askAgentStream(agent, input, metadata);

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    let lastSentProof = null;

    // If a payment proof already exists, send it once at the start
    if (lastPaymentHeader) {
      lastSentProof = lastPaymentHeader;
      res.write(
        `event: payment\ndata: ${JSON.stringify({ proof: lastPaymentHeader })}\n\n`
      );
      res.flush?.();
    }

    // Handle stream events
    emitter
      .on("message", (msg) => {
        // If a new payment proof is available, send it once
        if (lastPaymentHeader && lastPaymentHeader !== lastSentProof) {
          lastSentProof = lastPaymentHeader;
          res.write(
            `event: payment\ndata: ${JSON.stringify({ proof: lastPaymentHeader })}\n\n`
          );
        }

        // Send the main agent message
        res.write(`data: ${JSON.stringify({ type: "message", msg })}\n\n`);
        res.flush?.();
      })
      .on("status", (msg) => {
        res.write(`data: ${JSON.stringify({ type: "status", msg })}\n\n`);
        res.flush?.();
      })
      .on("done", () => {
        res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
        res.flush?.();
        res.end();
      })
      .on("error", (err) => {
        console.error("Stream error:", err);
        res.write(
          `data: ${JSON.stringify({ type: "error", msg: String(err) })}\n\n`
        );
        res.flush?.();
        res.end();
      });
  } catch (err) {
    console.error("askAgentStream failed:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/send
 * Body: { agent, input, metadata? }
 *
 * Sends a single message (non-streaming) and returns the result,
 * also attaching any payment proof as a response header.
 */
app.post("/api/send", async (req, res) => {
  const { agent, input, metadata } = req.body;
  if (!agent || !input) {
    return res.status(400).json({ error: "Missing 'agent' or 'input'" });
  }

  try {
    const response = await api.askAgentSend(agent, input, metadata);

    // Attach the payment header if present
    if (lastPaymentHeader) {
      res.setHeader("X-PAYMENT-RESPONSE", lastPaymentHeader);
    }

    res.json({ response });
  } catch (err) {
    console.error("askAgentSend failed:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Start Express server
 */
const PORT = process.env.PORT || 5050;
app.listen(PORT, () =>
  console.log(`🟢 DGENAI Proxy running at http://localhost:${PORT}`)
);
