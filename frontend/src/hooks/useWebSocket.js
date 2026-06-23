import { useRef, useEffect, useCallback, useState } from 'react';

const MAX_RECONNECT_DELAY = 30000;
const BASE_DELAY = 1000;

export default function useWebSocket(studentId, onMessage, sessionId = null) {
  const socketRef = useRef(null);
  const reconnectTimeout = useRef(null);
  const attemptRef = useRef(0);
  const messageQueueRef = useRef([]);
  const onMessageRef = useRef(onMessage);
  const [isConnected, setIsConnected] = useState(false);

  // Keep the callback ref up to date without triggering reconnect
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (!studentId) return;

    // Build WebSocket URL — use relative path so the Vite proxy works in dev
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host;
    let url = `${protocol}://${host}/ws/${studentId}`;
    if (sessionId) {
      url += `?session_id=${sessionId}`;
    }

    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.addEventListener('open', () => {
      setIsConnected(true);
      attemptRef.current = 0;

      // Flush queued messages
      while (messageQueueRef.current.length > 0) {
        const msg = messageQueueRef.current.shift();
        ws.send(msg);
      }
    });

    ws.addEventListener('message', (event) => {
      if (socketRef.current !== ws) return; // Ignore messages from stale connections
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current?.(data);
      } catch {
        // non-JSON payload — forward raw
        onMessageRef.current?.(event.data);
      }
    });

    ws.addEventListener('close', () => {
      if (socketRef.current !== ws) return;
      setIsConnected(false);
      scheduleReconnect();
    });

    ws.addEventListener('error', () => {
      // The socket will fire 'close' after 'error', so reconnect happens there.
      ws.close();
    });
  }, [studentId]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeout.current) return;

    const attempt = attemptRef.current;
    const delay = Math.min(BASE_DELAY * Math.pow(2, attempt), MAX_RECONNECT_DELAY);
    const jitter = delay * 0.3 * Math.random();

    reconnectTimeout.current = setTimeout(() => {
      reconnectTimeout.current = null;
      attemptRef.current += 1;
      connect();
    }, delay + jitter);
  }, [connect]);

  // Initial connect
  useEffect(() => {
    connect();

    return () => {
      // Cleanup on unmount
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      if (socketRef.current) {
        const ws = socketRef.current;
        socketRef.current = null;
        ws.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((payload) => {
    const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(raw);
    } else {
      // Queue for when we reconnect
      messageQueueRef.current.push(raw);
    }
  }, []);

  return { sendMessage, isConnected };
}
