import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // WebSocket Server
  const wss = new WebSocketServer({ server });

  // Simple state holder
  let globalState: any = null;

  wss.on('connection', (ws) => {
    // Send current state to new client
    if (globalState) {
      ws.send(JSON.stringify({ type: 'SYNC', state: globalState }));
    } else {
      ws.send(JSON.stringify({ type: 'REQUEST_STATE' }));
    }

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'UPDATE') {
          if (!globalState || (data.state.lastUpdated || 0) >= (globalState.lastUpdated || 0)) {
            globalState = data.state;
            // Broadcast to all OTHER clients
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'SYNC', state: globalState }));
              }
            });
          }
        }
      } catch (err) {
        console.error('WS message error:', err);
      }
    });
  });
}

startServer();
