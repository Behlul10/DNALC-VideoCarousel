// server.js
const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });
let connections = new Set();

// helper to broadcast slide commands
function broadcastSlideState(state) {
  const msg = JSON.stringify({
    slideState: state,
    timestamp: Date.now(),
  });
  connections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  });
}

wss.on("connection", (ws) => {
  console.log("New client connected!");
  connections.add(ws);

  // heartbeat to keep connection alive
  const hb = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({ type: "heartbeat", timestamp: Date.now() })
      );
    }
  }, 5000);

  // *DEMO:* send a “next” after 3 s
  setTimeout(() => broadcastSlideState("next"), 3000);

  ws.on("message", (data) => {
    // your existing message‐relay logic…
  });

  ws.on("close", () => {
    clearInterval(hb);
    connections.delete(ws);
    console.log("Client disconnected");
  });
});

console.log("WebSocket server started on ws://localhost:8080");
