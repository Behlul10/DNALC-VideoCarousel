const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

function broadcastSlideState(state) {
  const msg = JSON.stringify({
    slideState: state,
    timestamp: Date.now()
  });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
  console.log(`➡ broadcasted slideState="${state}"`);
}

// every 5 seconds, send a "next" command
setInterval(() => {
  broadcastSlideState("next");
}, 5000);

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

console.log("WebSocket server listening on ws://localhost:8080");
