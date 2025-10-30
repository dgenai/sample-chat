import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  OutlinedInput,
  InputAdornment,
  IconButton,
  CircularProgress,
  Button,
  useTheme,
  Card,
  CardActionArea,
  Avatar,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReactMarkdown from "react-markdown";

const API_BASE = "http://localhost:5050/api";

const TypingDots = () => (
  <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
    {[0, 1, 2].map((i) => (
      <Box
        key={i}
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: "#888",
          animation: "typingAnimation 1.4s infinite",
          animationDelay: `${i * 0.2}s`,
        }}
      />
    ))}
    <style>{`
      @keyframes typingAnimation {
        0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
        40% { transform: scale(1.2); opacity: 1; }
      }
    `}</style>
  </Box>
);

const MessageBubble = React.memo(function MessageBubble({ msg, theme }) {
  const isUser = msg.role === "user";
  const isSystem = msg.role === "system";

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        mb: 1.5,
        px: 1,
      }}
    >
      <Paper
        sx={{
          p: 1.5,
          px: 2,
          maxWidth: "75%",
          bgcolor: isSystem
            ? theme.palette.success.light + "15"
            : isUser
            ? theme.palette.primary.main
            : "rgba(255,255,255,0.08)",
          color: isUser
            ? theme.palette.primary.contrastText
            : theme.palette.text.primary,
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          boxShadow: isUser
            ? "0 2px 8px rgba(0,0,0,0.4)"
            : "0 2px 6px rgba(0,0,0,0.25)",
          backdropFilter: "blur(8px)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          "&:hover": { transform: "translateY(-1px)" },
        }}
      >
        <ReactMarkdown>{msg.content}</ReactMarkdown>
        <Typography
          variant="caption"
          sx={{ opacity: 0.6, display: "block", mt: 0.5 }}
        >
          {new Date(msg.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Typography>
      </Paper>
    </Box>
  );
});

export default function AgentChatbot() {
  const theme = useTheme();
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    async function loadAgents() {
      try {
        const res = await fetch(`${API_BASE}/agents`);
        const data = await res.json();
        setAgents(data);
      } catch (err) {
        console.error("Failed to fetch agents:", err);
      } finally {
        setLoadingAgents(false);
      }
    }
    loadAgents();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, statusMessage]);

  async function handleSseEvent(parsed) {
    const type = parsed.type;
    let msg = parsed.msg || parsed.data;

    if (type === "payment" && typeof msg === "string") {
      try {
        msg = JSON.parse(msg);
      } catch {}
    }

    switch (type) {
      case "status":
        setChatHistory((prev) => [
          ...prev,
          { role: "system", content: `🟡 ${msg}`, timestamp: new Date().toISOString() },
        ]);
        break;
      case "payment":
        if (!msg?.success) break;
        const explorer =
          msg.network === "solana"
            ? `https://solscan.io/tx/${msg.transaction}`
            : "#";
        setChatHistory((prev) => [
          ...prev,
          {
            role: "system",
            content: `💸 **Payment confirmed**  
Network: **${msg.network.toUpperCase()}**  
Payer: \`${msg.payer}\`  
[View transaction ↗](${explorer})`,
            timestamp: new Date().toISOString(),
          },
        ]);
        break;
      case "message":
        setChatHistory((prev) => {
          const text = msg || "";
          const last = prev[prev.length - 1];
          if (last && last.role === "agent" && last.streaming) {
            return [
              ...prev.slice(0, -1),
              { ...last, content: last.content + text, streaming: true },
            ];
          }
          return [
            ...prev,
            { role: "agent", content: text, timestamp: new Date().toISOString(), streaming: true },
          ];
        });
        break;
      case "done":
        setChatHistory((prev) =>
          prev.map((m) => (m.streaming ? { ...m, streaming: false } : m))
        );
        setLoadingResponse(false);
        break;
      case "error":
        setStatusMessage("Error during communication.");
        break;
    }
  }

  const sendMessage = async () => {
    if (!selectedAgent || !chatInput.trim()) return;
    const userMessage = {
      role: "user",
      content: chatInput,
      timestamp: new Date().toISOString(),
    };
    setChatHistory((prev) => [...prev, userMessage]);
    setChatInput("");
    setLoadingResponse(true);
    setStatusMessage(null);

    const payload = {
      agentId: selectedAgent.id,
      input: userMessage.content,
      userName: "web-client",
    };

    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Proxy returned ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        chunk
          .split("\n\n")
          .filter(Boolean)
          .forEach((line) => {
            if (!line.startsWith("data:")) return;
            const data = line.replace(/^data:\s*/, "");
            try {
              const parsed = JSON.parse(data);
              handleSseEvent(parsed);
            } catch (_) {}
          });
      }
      setLoadingResponse(false);
    } catch (err) {
      console.error("Failed to send message:", err);
      setStatusMessage("Error during communication.");
      setLoadingResponse(false);
    }
  };

  const handleReset = () => {
    setChatHistory([]);
    setChatInput("");
    setStatusMessage(null);
    setLoadingResponse(false);
  };

  if (!selectedAgent) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
          p: 3,
        }}
      >
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Choose your AI Agent
        </Typography>
        {loadingAgents ? (
          <CircularProgress />
        ) : (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              justifyContent: "center",
              maxWidth: 800,
            }}
          >
            {agents.map((agent) => (
              <Card
                key={agent.id}
                sx={{
                  width: 200,
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.06)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    border: `1px solid ${theme.palette.primary.main}`,
                    boxShadow: `0 0 12px ${theme.palette.primary.main}40`,
                  },
                  transition: "0.25s ease",
                }}
              >
                <CardActionArea
                  onClick={() => {
                    setSelectedAgent(agent);
                    handleReset();
                  }}
                  sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    minHeight: 160,
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      width: 44,
                      height: 44,
                      mb: 1.2,
                      fontWeight: 600,
                    }}
                  >
                    {agent.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{ mb: 0.5 }}
                  >
                    {agent.name}
                  </Typography>
                  {agent.description && (
                    <Typography
                      variant="body2"
                      sx={{
                        opacity: 0.6,
                        fontSize: "0.8rem",
                        lineHeight: 1.2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {agent.description}
                    </Typography>
                  )}
                </CardActionArea>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "radial-gradient(circle at top, #121212, #0a0a0a)",
      }}
    >
      <Paper
        elevation={8}
        sx={{
          width: "100%",
          maxWidth: 820,
          height: "90vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: 4,
          overflow: "hidden",
          background: "rgba(20,20,20,0.75)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 0 40px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            {selectedAgent.name}
          </Typography>
          <Button
            onClick={() => setSelectedAgent(null)}
            size="small"
            variant="outlined"
            startIcon={<RefreshIcon />}
          >
            Change Agent
          </Button>
        </Box>

        {/* Chat content */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            p: 2,
            pb: 10,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          {chatHistory.map((msg, i) => (
            <MessageBubble key={i} msg={msg} theme={theme} />
          ))}
          {statusMessage && (
            <Typography
              variant="body2"
              color="warning.main"
              sx={{ textAlign: "center", mb: 1 }}
            >
              {statusMessage}
            </Typography>
          )}
          {loadingResponse && (
            <Box display="flex" alignItems="center" mb={1}>
              <TypingDots />
            </Box>
          )}
          <div ref={chatEndRef} />
        </Box>

        {/* Input bar */}
        <Box
          sx={{
            p: 1.5,
            background: "rgba(15,15,15,0.9)",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <OutlinedInput
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type your message..."
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
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    "&:hover": { backgroundColor: theme.palette.primary.dark },
                  }}
                >
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            }
            sx={{
              borderRadius: 3,
              backgroundColor: "rgba(255,255,255,0.08)",
              color: "#fff",
              "& fieldset": { border: "none" },
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
}
