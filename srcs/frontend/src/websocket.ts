export function connectWebSocket() {
  const ws = new WebSocket("wss://localhost:8443/ws");

  ws.onopen = () => {
    console.log("WebSocket connecté");
    ws.send("hello server");
  };

  ws.onmessage = (event) => {
    console.log("Message reçu :", event.data);
  };

  ws.onerror = (err) => {
    console.error("WebSocket error", err);
  };

  ws.onclose = () => {
    console.log("WebSocket fermé");
  };

  return ws;
}
