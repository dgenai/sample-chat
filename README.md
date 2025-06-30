# dgenai Chatbot UI

A React-based chatbot interface to interact with AI agents from the [dgenai.io](https://dgenai.io) platform.
This project is an example usage of the dgenai.io API and is not intended for production use.


## 📦 Requirements

- Node.js >= 16
- npm or yarn
- A valid dgenai API key

---

## 🔧 Installation

1. **Clone this repository**

```bash
git clone https://github.com/dgenai/sample-chat.git
cd sample-chat
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
```

3. **Set your API key**

In `AgentChatbot.jsx`, replace the placeholder:

```js
const API_KEY = "";
```

with your actual API key:

```js
const API_KEY = "your-api-key-here";
```

---

## ▶️ Usage

Run the development server:

```bash
npm start
# or
yarn start
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔌 API Endpoints Used

All API endpoints are available and documented at:  
👉 [https://api.dgenai.io/swagger](https://api.dgenai.io/swagger)

This app uses:

- `GET /api/agents` — to retrieve the list of available agents.
- `POST /api/agents/{agentId}/ask` — to send user input and receive agent responses.

All requests must include the `X-Api-Key` HTTP header.

Example:

```http
GET /api/agents
Host: api.dgenai.io
X-Api-Key: your-api-key-here
```

---

## 📁 File Overview

- `AgentChatbot.jsx`: Main component for the chatbot UI and logic.
- Uses:
  - `axios` for HTTP requests
  - `@mui/material` for styling and UI
  - `react-markdown` to render agent responses

---

## 📝 Notes

- Chat history is stored in component state (not persisted).

---


## 🧩 Contributing

Contributions are not currently accepted for this sample project.

---

## 📬 Contact

For access or API support, visit [https://dgenai.io](https://dgenai.io) or contact your platform administrator.
