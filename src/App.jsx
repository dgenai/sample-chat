import React, { useState, useMemo } from "react";
import {
  ThemeProvider,
  CssBaseline,
  IconButton,
  AppBar,
  Toolbar,
  Typography,
  Box,
  alpha,
  useTheme,
} from "@mui/material";
import { lightTheme, darkTheme } from "./theme.js";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { WalletMultiButton, WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";
import logo from "./logo.svg";
import "./App.css";
import AgentChatbot from "./AgentChatBot/AgentChatBot.jsx";

function AppContent({ darkMode, setDarkMode }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        background: theme.palette.mode === "dark"
          ? `linear-gradient(145deg, ${alpha("#000", 0.95)}, ${alpha("#111", 0.9)})`
          : `linear-gradient(145deg, ${alpha("#fff", 0.95)}, ${alpha("#f5f7fa", 0.9)})`,
        fontFamily: '"JetBrains Mono", monospace',
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* HEADER */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: theme.palette.mode === "dark"
            ? `linear-gradient(145deg, ${alpha("#000", 0.95)}, ${alpha("#111", 0.9)})`
            : `linear-gradient(145deg, ${alpha("#fff", 0.9)}, ${alpha("#f5f7fa", 0.95)})`,
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
          boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.1)}`,
          backdropFilter: "blur(10px)",
          position: "relative",
          zIndex: 10,
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0, rgba(255,255,255,0.02) 1px, transparent 2px, transparent 4px)",
            opacity: 0.2,
            pointerEvents: "none",
          },
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              theme.palette.mode === "dark"
                ? "radial-gradient(circle at 50% 50%, rgba(0,255,200,0.05), transparent 70%)"
                : "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.03), transparent 70%)",
            pointerEvents: "none",
          },
        }}
      >
        <Toolbar
          sx={{
            justifyContent: "space-between",
            width: "100%",
            maxWidth: "1400px",
            mx: "auto",
            py: 1.2,
            px: 2,
            position: "relative",
            zIndex: 2,
          }}
        >
          {/* Logo + titre */}
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              component="img"
              src={logo}
              alt="logo"
              sx={{
                width: 34,
                height: 34,
                filter:
                  theme.palette.mode === "dark"
                    ? `drop-shadow(0 0 6px ${alpha(theme.palette.primary.light, 0.5)})`
                    : "none",
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                letterSpacing: 0.5,
                color: theme.palette.primary.main,
                textShadow: `0 0 8px ${alpha(theme.palette.primary.main, 0.4)}`,
                fontFamily: '"JetBrains Mono", monospace',
              }}
            >
              DGENAI
            </Typography>
          </Box>

          {/* Actions */}
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton
              onClick={() => setDarkMode(!darkMode)}
              sx={{
                border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
                background: alpha(theme.palette.primary.main, 0.08),
                color: theme.palette.primary.main,
                "&:hover": {
                  background: alpha(theme.palette.primary.main, 0.15),
                  boxShadow: `0 0 10px ${alpha(theme.palette.primary.main, 0.25)}`,
                },
              }}
            >
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>

            <WalletMultiButton
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                borderRadius: "8px",
                padding: "6px 12px",
                fontWeight: 600,
                background: alpha(theme.palette.primary.main, 0.08),
                color: theme.palette.primary.main,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
                boxShadow: `0 0 8px ${alpha(theme.palette.primary.main, 0.15)}`,
              }}
            />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Chat principal */}
      <Box
        sx={{
          flex: 1,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          px: 2,
        }}
      >
        <AgentChatbot />
      </Box>
    </Box>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const endpoint = useMemo(() => "https://api.mainnet-beta.solana.com", []);
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
<ConnectionProvider endpoint={endpoint}>
  <WalletProvider wallets={wallets} autoConnect>
    <WalletModalProvider>
      <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
        <CssBaseline />
        <AppContent darkMode={darkMode} setDarkMode={setDarkMode} />
      </ThemeProvider>
    </WalletModalProvider>
  </WalletProvider>
</ConnectionProvider>

  );
}

export default App;
