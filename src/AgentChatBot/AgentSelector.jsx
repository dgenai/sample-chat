import React from "react";
import {
  Box,
  Typography,
  CardActionArea,
  useTheme,
  Avatar,
  alpha,
} from "@mui/material";

export default function AgentSelector({ agents, onSelect }) {
  const theme = useTheme();
  const accent =
    theme.palette.mode === "dark"
      ? theme.palette.primary.light
      : theme.palette.primary.main;
  const isDark = theme.palette.mode === "dark";
  const bg = isDark
    ? `linear-gradient(145deg, ${alpha("#000", 0.95)}, ${alpha("#111", 0.9)})`
    : `linear-gradient(145deg, ${alpha("#fff", 0.9)}, ${alpha("#f5f7fa", 0.95)})`;
  const text = theme.palette.text.primary;

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: bg,
        color: text,
        fontFamily: '"JetBrains Mono", monospace',
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0, rgba(255,255,255,0.02) 1px, transparent 2px, transparent 4px)",
          opacity: 0.25,
          pointerEvents: "none",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          background: isDark
            ? "radial-gradient(circle at 50% 30%, rgba(0,255,200,0.05), transparent 70%)"
            : "radial-gradient(circle at 50% 30%, rgba(0,0,0,0.03), transparent 70%)",
          pointerEvents: "none",
        },
      }}
    >
      {/* Header */}
      <Typography
        variant="h6"
        sx={{
          mb: 4,
          color: accent,
          fontWeight: 700,
          letterSpacing: 0.8,
          textShadow: `0 0 8px ${alpha(accent, 0.3)}`,
          position: "relative",
          zIndex: 2,
        }}
      >
        [ Select your AI agent ]
      </Typography>

      {/* Agents list */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 3,
          maxWidth: 900,
          px: 2,
          zIndex: 2,
        }}
      >
        {agents.map((agent) => (
          <Box
            key={agent.id}
            component={CardActionArea}
            onClick={() => onSelect(agent)}
            sx={{
              width: 250,
              height: 180,
              p: 2.4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "10px",
              border: `1px solid ${alpha(accent, 0.25)}`,
              background: `linear-gradient(145deg, ${alpha(
                accent,
                0.08
              )}, ${alpha(accent, 0.02)})`,
              color: text,
              textAlign: "center",
              transition: "0.25s ease",
              boxShadow: `0 0 15px ${alpha(accent, 0.05)}`,
              position: "relative",
              overflow: "hidden",
              "&:hover": {
                transform: "translateY(-2px)",
                border: `1px solid ${alpha(accent, 0.7)}`,
                boxShadow: `0 0 20px ${alpha(accent, 0.25)}`,
                "&::before": { opacity: 1 },
              },
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                borderRadius: "inherit",
                background: `radial-gradient(circle at center, ${alpha(
                  accent,
                  0.15
                )}, transparent 70%)`,
                opacity: 0,
                transition: "opacity 0.3s ease",
              },
            }}
          >
            <Avatar
              sx={{
                bgcolor: alpha(accent, 0.1),
                color: accent,
                border: `1px solid ${alpha(accent, 0.4)}`,
                width: 52,
                height: 52,
                fontWeight: 700,
                mb: 1.4,
                fontSize: "1.1rem",
                boxShadow: `0 0 8px ${alpha(accent, 0.2)}`,
              }}
            >
              {agent.name.charAt(0).toUpperCase()}
            </Avatar>

            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "1rem",
                color: accent,
                mb: 0.8,
                textShadow: `0 0 6px ${alpha(accent, 0.25)}`,
              }}
            >
              {agent.name}
            </Typography>

            {agent.description && (
              <Typography
                sx={{
                  color: alpha(text, 0.8),
                  fontSize: "0.8rem",
                  lineHeight: 1.4,
                  maxWidth: "90%",
                  height: "2.7em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  pb: "0.2em",
                }}
              >
                {agent.description}
              </Typography>
            )}
          </Box>
        ))}
      </Box>

      {/* Footer hint */}
      <Typography
        sx={{
          mt: 5,
          fontSize: "0.85rem",
          color: alpha(accent, 0.6),
          zIndex: 2,
        }}
      >
        {"> "} select-agent
      </Typography>
    </Box>
  );
}
