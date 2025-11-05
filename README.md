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

3. **Set your .env**


```js
VITE_NETWORK=solana
VITE_PRIVATE_KEY=PRIVATE_KEY
VITE_BASE_URL="https://api.dgenai.io"
VITE_SERVER_URL="http://localhost:5050/api"
```

---

## ▶️ Usage

Run the development server:

```bash
npm run start
# or
yarn start
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔌 API Endpoints Used

All API endpoints are available and documented at:  
👉 [https://api.dgenai.io/swagger](https://api.dgenai.io/swagger)

---

## 📝 Notes

- Chat history is stored in component state (not persisted).

---


## 🧩 Contributing

Contributions are not currently accepted for this sample project.

---

## 📬 Contact

For access or API support, send a mail to contact@dgenai.io
