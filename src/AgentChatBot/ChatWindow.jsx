import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  OutlinedInput,
  InputAdornment,
  IconButton,
  Button,
  Divider,
  alpha,
  useTheme,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import RefreshIcon from "@mui/icons-material/Refresh";
import TypingDots from "./TypingDots";
import MessageBubble from "./MessageBubble";
import { parseSSEStream } from "../parseSSEStream";

export default function ChatWindow({ agent, onBack, apiBase }) {
  const theme = useTheme();
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const chatEndRef = useRef(null);

  const accent =
    theme.palette.mode === "dark"
      ? theme.palette.primary.light
      : theme.palette.primary.main;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  function appendStreamedText(text) {
    setChatHistory((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === "agent" && last.streaming) {
        return [
          ...prev.slice(0, -1),
          { ...last, content: last.content + text, streaming: true },
        ];
      }
      return [
        ...prev,
        {
          role: "agent",
          content: text,
          timestamp: new Date().toISOString(),
          streaming: true,
        },
      ];
    });
  }

  function handleSseEvent(parsed) {
    const { type, msg, data } = parsed;
    const content = msg || data;

    switch (type) {
      case "status":
        setStatusMessage(content);
        break;
      case "payment":
        try {
          const info = typeof content === "string" ? JSON.parse(content) : content;
          if (info?.success) {
            const link =
              info.network === "solana"
                ? `https://solscan.io/tx/${info.transaction}`
                : "#";
            setPaymentInfo({
              success: true,
              network: info.network,
              link,
              transaction: info.transaction,
            });
          } else setPaymentInfo({ success: false });
        } catch {
          setPaymentInfo({ error: true });
        }
        break;
      case "message":
        appendStreamedText(content || "");
        break;
      case "error":
        setStatusMessage("⚠️ Connection error");
        setLoadingResponse(false);
        break;
      case "done":
        setChatHistory((prev) =>
          prev.map((m) => (m.streaming ? { ...m, streaming: false } : m))
        );
        setStatusMessage(null);
        setLoadingResponse(false);
        break;
      default:
        break;
    }
  }

  const sendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = {
      role: "user",
      content: chatInput,
      timestamp: new Date().toISOString(),
    };
    setChatHistory((prev) => [...prev, userMessage]);
    setChatInput("");
    setLoadingResponse(true);
    setStatusMessage("⏳ Processing...");
    setPaymentInfo(null);

    const payload = {
      agentId: agent.id,
      input: userMessage.content,
      userName: "web-client",
    };

    try {
      const res = await fetch(`${apiBase}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok || !res.body) throw new Error("No SSE body");
      const stream = parseSSEStream(res.body);
      for await (const event of stream) handleSseEvent(event);
    } catch (err) {
      console.error("Stream error:", err);
      setStatusMessage("❌ Connection lost.");
    } finally {
      setLoadingResponse(false);
    }
  };

  return (
    <Paper
      sx={{
        width: "100%",
        maxWidth: 820,
        height: "90vh",
        display: "flex",
        flexDirection: "column",
        borderRadius: "1rem",
        overflow: "hidden",
        position: "relative",
        background:
          theme.palette.mode === "dark"
            ? `linear-gradient(145deg, ${alpha("#000", 0.9)}, ${alpha("#111", 0.95)})`
            : `linear-gradient(145deg, ${alpha("#fff", 0.85)}, ${alpha("#f5f7fa", 0.95)})`,
        border: `1px solid ${alpha(accent, 0.25)}`,
        boxShadow:
          theme.palette.mode === "dark"
            ? `0 0 25px ${alpha(accent, 0.15)}`
            : `0 0 15px ${alpha("#000", 0.1)}`,
        fontFamily: '"JetBrains Mono", monospace',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 1.5,
          borderBottom: `1px solid ${alpha(accent, 0.25)}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background:
            theme.palette.mode === "dark"
              ? alpha(accent, 0.07)
              : alpha(accent, 0.1),
        }}
      >
        <Typography sx={{ fontWeight: 600 }}>
          [ Connected to{" "}
          <span style={{ color: accent }}>{agent.name}</span> ]
        </Typography>

        <Button
          onClick={onBack}
          size="small"
          startIcon={<RefreshIcon />}
          sx={{
            textTransform: "none",
            color: accent,
            border: `1px solid ${alpha(accent, 0.4)}`,
            "&:hover": {
              background: alpha(accent, 0.15),
              borderColor: accent,
            },
          }}
        >
          switch-agent
        </Button>
      </Box>

      {/* Chat */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          p: 3,
          pb: 8,
          whiteSpace: "pre-wrap",
          lineHeight: 1.6,
          textAlign: "left",
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: alpha(accent, 0.25),
            borderRadius: "3px",
          },
        }}
      >
        {chatHistory.map((msg, i) => (
          <MessageBubble key={i} msg={msg} theme={theme} />
        ))}
        {loadingResponse && !chatHistory.some((m) => m.streaming) && (
          <Box display="flex" alignItems="center" mb={1}>
            <TypingDots />
          </Box>
        )}
        <div ref={chatEndRef} />
      </Box>

      {/* Transaction block */}
      {paymentInfo && (
        <Box
          sx={{
            mx: 3,
            mb: 2,
            px: 2,
            py: 1.2,
            borderRadius: 1,
            border: `1px solid ${alpha(
              paymentInfo.success ? accent : theme.palette.error.main,
              0.4
            )}`,
            backgroundColor:
              theme.palette.mode === "dark"
                ? alpha(accent, 0.05)
                : alpha(accent, 0.08),
            fontSize: "0.85rem",
            color: paymentInfo.success
              ? accent
              : theme.palette.error.main,
            textAlign: "left",
          }}
        >
          {paymentInfo.error && "⚠️ Invalid payment data."}
          {!paymentInfo.error && paymentInfo.success && (
            <>
              Transaction confirmed on{" "}
              <strong>{paymentInfo.network.toUpperCase()}</strong> —{" "}
              <a
                href={paymentInfo.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: accent,
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                View on Solscan
              </a>
            </>
          )}
          {!paymentInfo.error && paymentInfo.success === false && (
            <>Transaction failed.</>
          )}
        </Box>
      )}

      {/* Status + Input */}
      <Box
        sx={{
          p: 1.5,
          borderTop: `1px solid ${alpha(accent, 0.25)}`,
          background:
            theme.palette.mode === "dark"
              ? alpha("#111", 0.9)
              : alpha("#fafafa", 0.95),
          backdropFilter: "blur(8px)",
        }}
      >
        {statusMessage && (
          <Typography
            sx={{
              mb: 1,
              px: 1,
              py: 0.5,
              color: accent,
              fontSize: "0.8rem",
              opacity: 0.8,
              fontFamily: '"JetBrains Mono", monospace',
              textAlign: "left",
            }}
            dangerouslySetInnerHTML={{ __html: statusMessage }}
          />
        )}

        <OutlinedInput
          fullWidth
          multiline
          maxRows={4}
          placeholder="> Type your command..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                onClick={sendMessage}
                disabled={!chatInput.trim() || loadingResponse}
                sx={{
                  background: alpha(accent, 0.15),
                  color: accent,
                  border: `1px solid ${alpha(accent, 0.4)}`,
                  "&:hover": { background: alpha(accent, 0.25) },
                }}
              >
                <SendIcon />
              </IconButton>
            </InputAdornment>
          }
          sx={{
            color: theme.palette.text.primary,
            background:
              theme.palette.mode === "dark"
                ? alpha("#fff", 0.05)
                : alpha("#000", 0.02),
            fontFamily: '"JetBrains Mono", monospace',
            "& fieldset": { border: `1px solid ${alpha(accent, 0.25)}` },
            "&:hover fieldset": { borderColor: alpha(accent, 0.4) },
            "&.Mui-focused fieldset": {
              borderColor: accent,
              boxShadow: `0 0 10px ${alpha(accent, 0.3)}`,
            },
            "& .MuiInputBase-input::placeholder": {
              color: alpha(accent, 0.4),
            },
          }}
        />
      </Box>
    </Paper>
  );
}
