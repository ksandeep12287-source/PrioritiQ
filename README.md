# PrioritiQ 🚀

PrioritiQ is a production-ready, professionally structured MERN (MongoDB, Express, React, Node.js) workspace skeleton. 

This repository features a separate frontend client (**React + Vite**) and a backend api server (**Node.js + Express**), configured for standard development workflows.

---

## 📁 Project Architecture

The workspace is organized into separate directories for client-side and server-side configurations:

```
prioritiQ/
├── client/                     # Frontend Vite + React project (JavaScript)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── layouts/            # Page layouts
│   │   ├── pages/              # View pages (dashboard, settings, etc.)
│   │   ├── context/            # React global context providers
│   │   ├── hooks/              # Custom React hooks
│   │   ├── App.jsx             # Main interactive dashboard container
│   │   └── index.css           # Custom dark-theme design system
│   ├── .env.example            # Environment parameters template
│   ├── package.json            # Client dependency configuration
│   └── vite.config.js          # Vite compilation settings
│
├── server/                     # Backend API server (Node.js + Express)
│   ├── src/
│   │   ├── config/             # Connection configurations (MongoDB reserved)
│   │   ├── controllers/        # Request handling controllers (status diagnostics)
│   │   ├── middlewares/        # Express custom middlewares (error handlers)
│   │   ├── routes/             # Routing mapping tables
│   │   ├── app.js              # Express app setup and middleware pipeline
│   │   └── index.js            # Server entrypoint and lifecycle listener
│   ├── .env.example            # Server environment configuration parameters
│   └── package.json            # Server dependency configuration
│
├── package.json                # Workspace orchestration package setup
├── .gitignore                  # Global gitignore configuration
└── README.md                   # Setup and usage guide
```

---

## 🛠️ Prerequisites

Ensure you have the following software installed locally:
- **Node.js** (LTS version recommended)
- **NPM** (Node Package Manager)

---

## 📥 Getting Started & Installation

To initialize the entire workspace (installing dependencies for the root orchestrator, frontend client, and backend server) in one command:

1. Open a terminal in the root workspace directory.
2. Run the following command:
   ```bash
   npm run install-all
   ```

This runs installations recursively across all packages.

---

## ⚙️ Environment Variables Configuration

Both the frontend and backend require configuration values declared in local `.env` files. Copy the provided templates to activate configurations:

### 1. Backend Server Env
1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Copy the example file and edit if necessary:
   ```bash
   cp .env.example .env
   ```
   *By default, the server runs on port `5000` (`PORT=5000`).*

### 2. Frontend Client Env
1. Navigate to the `client/` directory:
   ```bash
   cd client
   ```
2. Copy the example file:
   ```bash
   cp .env.example .env
   ```
   *The client expects the API base URL at `VITE_API_URL=http://localhost:5000/api`.*

---

## 🏃 Running the Application

You can launch both the React frontend and the Express backend simultaneously from the root directory using a single orchestrator command:

```bash
npm run dev
```

- **Frontend Client** will launch at: [http://localhost:5173](http://localhost:5173)
- **Backend API Server** will launch at: [http://localhost:5000](http://localhost:5000)
- **Health Check Route**: [http://localhost:5000/health](http://localhost:5000/health)
- **Status API Route**: [http://localhost:5000/api/status](http://localhost:5000/api/status)

---

## 📋 Available Workspace Scripts

From the root directory:
- `npm run install-all`: Performs standard installation of npm packages recursively across all folders.
- `npm run dev`: Starts the frontend client and backend server concurrently in hot-reload mode.
- `npm run client`: Starts the Vite React dev compiler only.
- `npm run server`: Starts the backend Express process with `nodemon` dev reloaders.

---

## ⚠️ Notes on Negative Constraints

This skeleton is explicitly configured without:
- **Database Connection logic / Models** (Mongoose files and MongoDB configs are omitted and ready to be plugged in).
- **Authentication controllers / middleware** (ready to insert passport/JWT/session systems).
- **AI modules, Voice interfaces, or Calendar integrations**.
- **Unnecessary libraries** (the environment is kept lightweight).
