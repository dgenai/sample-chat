import React from "react";
import { Box, keyframes, useTheme } from "@mui/material";

const pulse = keyframes`
  0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
  40% { transform: scale(1.2); opacity: 1; }
`;

export default function TypingDots() {
  const theme = useTheme();
  const color =
    theme.palette.mode === "dark"
      ? theme.palette.primary.main
      : theme.palette.primary.dark;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        mt: "4px",
        pl: "2px",
      }}
    >
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}`,
            animation: `${pulse} 1.3s ease-in-out ${i * 0.25}s infinite`,
          }}
        />
      ))}
    </Box>
  );
}
