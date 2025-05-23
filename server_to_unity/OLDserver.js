/*
const WebSocket = require('ws');

// Create WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });

// Connection event
wss.on('connection', function connection(ws) {
    console.log('New client connected!');

    // Send a message to the client every 2 seconds
    setInterval(() => {
        ws.send('Hello from server!');
    }, 2000);

    // Receive message from client
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });
});

console.log('WebSocket server started on ws://localhost:8080');
*/

// server.js
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('New client connected!');

  // send a dummy SlideMessage every 2 seconds
  const intervalId = setInterval(() => {
    const slideState = Math.random() > 0.5 ? 'next' : 'previous';
    const msg = {
      rightHand: { isClosed: false, x: Math.random(), y: Math.random() },
      slideState: slideState,
      timestamp: Date.now()
    };
    ws.send(JSON.stringify(msg));
  }, 2000);

  ws.on('message', (data) => {
    console.log('received from client:', data.toString());
  });

  ws.on('close', () => {
    clearInterval(intervalId);
    console.log('Client disconnected');
  });
});

console.log('WebSocket server started on ws://localhost:8080');
