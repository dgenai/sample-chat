import React, { useState } from 'react';

import logo from './logo.svg';
import './App.css';
import AgentChatbot from "./AgentChatBot/AgentChatBot.jsx";
import { ThemeProvider, CssBaseline, IconButton } from '@mui/material';
import { lightTheme, darkTheme } from './theme.js';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="App">
        <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <IconButton
        sx={{ position: 'absolute', top: 8, right: 8 }}
        onClick={() => setDarkMode(!darkMode)}
        color="inherit"
      >
        {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
      <AgentChatbot />
    </ThemeProvider>
    </div>
  );
}

export default App;
