import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import ReactMarkdown from "react-markdown";
import { useTheme } from "@mui/material";

export default function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  const isSystem = msg.role === "system";
  const theme = useTheme();

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
            : theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.08)"
            : "rgba(0,0,0,0.05)",
          color: isUser
            ? theme.palette.mode === "dark"
              ? "#fff" 
              : theme.palette.primary.contrastText
            : theme.palette.mode === "dark"
            ? theme.palette.grey[100]
            : theme.palette.text.primary,
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          boxShadow: isUser
            ? "0 2px 8px rgba(0,0,0,0.4)"
            : "0 2px 6px rgba(0,0,0,0.25)",
          backdropFilter: "blur(8px)",
          transition: "transform 0.2s ease",
          "&:hover": { transform: "translateY(-1px)" },
        }}
      >
        <ReactMarkdown>{msg.content}</ReactMarkdown>
        <Typography
          variant="caption"
          sx={{
            opacity: 0.6,
            display: "block",
            mt: 0.5,
            textAlign: isUser ? "right" : "left",
          }}
        >
          {new Date(msg.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Typography>
      </Paper>
    </Box>
  );
}
