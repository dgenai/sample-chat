import React, { useEffect, useState } from "react";
import { Box, CircularProgress, useTheme } from "@mui/material";
import AgentSelector from "./AgentSelector";
import ChatWindow from "./ChatWindow.jsx";

const API_BASE = "http://localhost:5050/api";

export default function AgentChatbot() {
  const theme = useTheme();
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [loadingAgents, setLoadingAgents] = useState(true);

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

  return (
    <Box
      sx={{
        flex: 1,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background:
          theme.palette.mode === "dark"
            ? `radial-gradient(circle at 20% 20%, #141414, ${theme.palette.background.default})`
            : `radial-gradient(circle at 20% 20%, #f0f0f0, ${theme.palette.background.default})`,
        transition: "background 0.4s ease",
      }}
    >
      {loadingAgents ? (
        <CircularProgress />
      ) : !selectedAgent ? (
        <AgentSelector
          agents={agents}
          onSelect={(agent) => setSelectedAgent(agent)}
        />
      ) : (
        <Box
          sx={{
            flex: 1,
            width: "50%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "stretch", 
          }}
        >
          <ChatWindow
            agent={selectedAgent}
            onBack={() => setSelectedAgent(null)}
            apiBase={API_BASE}
          />
        </Box>
      )}
    </Box>
  );
}
