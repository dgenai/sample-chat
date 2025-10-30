// theme.js
import { createTheme } from "@mui/material/styles";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#f9f9fb",
      paper: "#ffffffcc", // léger glass effet
    },
    primary: {
      main: "#1976d2",
    },
    text: {
      primary: "#0f0f0f",
      secondary: "#555",
    },
    typography: {
      fontFamily: '"Fira Code", monospace',
    },
    
  },
  shape: { borderRadius: 14 },
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#090b0f",
      paper: "rgba(22,25,30,0.6)", // semi-transparent
    },
    primary: {
      main: "#6ea8ff",
    },
    text: {
      primary: "#eaeaea",
      secondary: "#aaa",
    },
    typography: {
      fontFamily: '"Fira Code", monospace',
    },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(20px)",
          backgroundImage:
            "linear-gradient(145deg, rgba(30,32,38,0.9), rgba(15,16,20,0.9))",
          border: "1px solid rgba(255,255,255,0.08)",
        },
      },
    },
  },
});
