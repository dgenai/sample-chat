import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Typography,
    Paper,
    Avatar,
    CircularProgress,
    OutlinedInput,
    InputAdornment,
    IconButton,
    useTheme,
    Button
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReactMarkdown from 'react-markdown';

const API_KEY = "";
const API_ENDPOINT = "api.dgenai.io";

const TypingDots = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', height: '20px' }}>
        {[0, 1, 2].map((i) => (
            <Box
                key={i}
                sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: '#999',
                    animation: 'typingAnimation 1.4s infinite',
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

export default function AgentChatbot() {
    const theme = useTheme();
    const [agents, setAgents] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState('');
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [loadingAgents, setLoadingAgents] = useState(true);
    const [loadingResponse, setLoadingResponse] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        axios.get(`${API_ENDPOINT}/api/agents`, {
            headers: { 'X-Api-Key': API_KEY }
        })
            .then(response => setAgents(response.data))
            .catch(error => console.error('Failed to load agents:', error))
            .finally(() => setLoadingAgents(false));
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const sendMessage = async () => {
        if (!selectedAgent || !chatInput.trim()) return;

        const userMessage = {
            role: 'user',
            content: chatInput,
            timestamp: new Date().toISOString()
        };

        const updatedHistory = [...chatHistory, userMessage];
        setChatHistory(updatedHistory);
        setChatInput('');
        setLoadingResponse(true);

        try {
            const response = await axios.post(`${API_ENDPOINT}/api/agents/${selectedAgent}/ask`, {
                input: updatedHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')
            }, {
                headers: { 'X-Api-Key': API_KEY }
            });

            const agentMessage = {
                role: 'agent',
                content: response.data,
                timestamp: new Date().toISOString()
            };

            setChatHistory([...updatedHistory, agentMessage]);
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setLoadingResponse(false);
        }
    };

    const selectedAgentObj = agents.find(a => a.id === selectedAgent);

    const handleReset = () => {
        setChatHistory([]);
        setChatInput('');
    };

    return (
        <Box
            sx={{
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: theme.palette.background.default,
                p: { xs: 1, sm: 2 },
            }}
        >
            <Paper
                elevation={4}
                sx={{
                    width: '100%',
                    maxWidth: 800,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: { xs: 0, sm: 4 },
                    p: 2,
                }}
            >
                {/* Header: avatar, name, description, selector */}
                <Box
                    component={Paper}
                    elevation={1}
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        justifyContent: 'space-between',
                        gap: 2,
                        mb: 2,
                        p: 2,
                        borderRadius: 3,
                        backgroundColor: theme.palette.background.paper,
                    }}
                >
                    {/* Agent avatar, name and description */}
                    <Box display="flex" alignItems="center" gap={2}>
                        {selectedAgentObj?.imageUrl && (
                            <Avatar src={selectedAgentObj.imageUrl} sx={{ width: 56, height: 56 }} />
                        )}
                        <Box>
                            <Typography variant="h6" fontWeight={700}>
                                {selectedAgentObj?.name || 'Chit Chat'}
                            </Typography>
                            {selectedAgentObj?.description && (
                                <Typography variant="body2" color="text.secondary">
                                    {selectedAgentObj.description}
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    {/* Agent selector */}
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel id="agent-select-label">Choose an agent</InputLabel>
                        <Select
                            labelId="agent-select-label"
                            value={selectedAgent}
                            label="Choose an agent"
                            onChange={(e) => {
                                setSelectedAgent(e.target.value);
                                setChatHistory([]);
                            }}
                            disabled={loadingAgents}
                        >
                            {loadingAgents ? (
                                <MenuItem disabled>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <CircularProgress size={20} />
                                        <Typography>Loading agents...</Typography>
                                    </Box>
                                </MenuItem>
                            ) : agents.map(agent => (
                                <MenuItem key={agent.id} value={agent.id}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        {agent.imageUrl && (
                                            <Avatar src={agent.imageUrl} sx={{ width: 24, height: 24 }} />
                                        )}
                                        {agent.name}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Reset button */}
                    {chatHistory.length > 0 && (
                        <Button
                            onClick={handleReset}
                            size="small"
                            startIcon={<RefreshIcon />}
                            variant="outlined"
                        >
                            Reset
                        </Button>
                    )}
                </Box>

                {/* Chat history */}
                <Box
                    sx={{
                        flexGrow: 1,
                        overflowY: 'auto',
                        my: 2,
                        pr: 1,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {chatHistory.map((msg, idx) => (
                        <Box
                            key={idx}
                            sx={{
                                display: 'flex',
                                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                                alignItems: 'flex-end',
                                mb: 1,
                                px: 1,
                            }}
                        >
                            {msg.role === 'agent' && selectedAgentObj?.imageUrl && (
                                <Avatar
                                    src={selectedAgentObj.imageUrl}
                                    alt="Agent"
                                    sx={{ width: 32, height: 32, mr: 1 }}
                                />
                            )}
                            <Paper
                                elevation={1}
                                sx={{
                                    maxWidth: '75%',
                                    p: 1.5,
                                    backgroundColor:
                                        msg.role === 'user'
                                            ? theme.palette.primary.main
                                            : theme.palette.mode === 'dark'
                                                ? theme.palette.grey[800]
                                                : theme.palette.grey[100],
                                    color:
                                        msg.role === 'user'
                                            ? theme.palette.primary.contrastText
                                            : theme.palette.text.primary,
                                    borderRadius: msg.role === 'user'
                                        ? '16px 16px 4px 16px'
                                        : '16px 16px 16px 4px',
                                    wordBreak: 'break-word',
                                }}
                            >
                                {msg.role === 'agent' ? (
                                  <ReactMarkdown
                                  components={{
                                      p: ({ node, ...props }) => (
                                          <Typography component="p" {...props} sx={{ textAlign: 'left', m: 0, mb: 1 }} />
                                      ),
                                      li: ({ node, ...props }) => (
                                          <li style={{ textAlign: 'left', marginBottom: '4px' }} {...props} />
                                      ),
                                      h1: ({ node, ...props }) => (
                                          <Typography variant="h4" component="h1" {...props} sx={{ textAlign: 'left', mt: 2, mb: 1 }} />
                                      ),
                                      h2: ({ node, ...props }) => (
                                          <Typography variant="h5" component="h2" {...props} sx={{ textAlign: 'left', mt: 2, mb: 1 }} />
                                      ),
                                      h3: ({ node, ...props }) => (
                                          <Typography variant="h6" component="h3" {...props} sx={{ textAlign: 'left', mt: 2, mb: 1 }} />
                                      ),
                                      h4: ({ node, ...props }) => (
                                          <Typography variant="subtitle1" component="h4" {...props} sx={{ textAlign: 'left', mt: 2, mb: 1 }} />
                                      ),
                                      strong: ({ node, ...props }) => (
                                          <Typography component="span" sx={{ fontWeight: 700 }} {...props} />
                                      )
                                  }}
                              >
                                  {msg.content}
                              </ReactMarkdown>
                              
                                ) : (
                                    <Typography sx={{ textAlign: 'left', m: 0 }}>{msg.content}</Typography>
                                )}
                                {msg.timestamp && (
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            display: 'block',
                                            textAlign: msg.role === 'user' ? 'right' : 'left',
                                            mt: 0.5,
                                            opacity: 0.6
                                        }}
                                    >
                                        {new Date(msg.timestamp).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </Typography>
                                )}
                            </Paper>
                        </Box>
                    ))}

                    {/* Typing animation */}
                    {loadingResponse && (
                        <Box display="flex" flexDirection="row" alignItems="center" mb={1} px={1}>
                            {selectedAgentObj?.imageUrl && (
                                <Avatar src={selectedAgentObj.imageUrl} alt="Agent" sx={{ width: 32, height: 32, mr: 1 }} />
                            )}
                            <Paper
                                elevation={0}
                                sx={{
                                    px: 2,
                                    py: 1,
                                    backgroundColor:
                                        theme.palette.mode === 'dark'
                                            ? theme.palette.grey[800]
                                            : theme.palette.grey[100],
                                    borderRadius: '16px 16px 16px 4px',
                                }}
                            >
                                <TypingDots />
                            </Paper>
                        </Box>
                    )}
                    <div ref={chatEndRef} />
                </Box>

                {/* Input field */}
                <Box
                    component="form"
                    onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                    sx={{
                        position: 'sticky',
                        bottom: 0,
                        pt: 1,
                    }}
                >
                    <OutlinedInput
                        fullWidth
                        multiline
                        placeholder="Type your message..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                        endAdornment={
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={sendMessage}
                                    disabled={!chatInput.trim() || loadingResponse}
                                    edge="end"
                                    color="primary"
                                >
                                    <SendIcon />
                                </IconButton>
                            </InputAdornment>
                        }
                        sx={{
                            backgroundColor: theme.palette.background.paper,
                            borderRadius: 3,
                            px: 2,
                            py: 1,
                            '& fieldset': { borderColor: theme.palette.divider },
                        }}
                    />
                </Box>
            </Paper>
        </Box>
    );
}
