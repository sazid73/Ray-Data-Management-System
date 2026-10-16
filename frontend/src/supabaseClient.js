// Supabase HTTP REST + Realtime WebSocket Adapter
// Keeps the frontend 100% self-sufficient without requiring a separate backend server!

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ggbsakupvuxscootpeny.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_vRafxsnrOC1gM7EY6ayOLA_mnJ5rBos';

export const getHeaders = (extra = {}) => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  ...extra
});

// Realtime WebSocket channel for user typing, focus, blur, and live cell updates
class TrackerRealtime {
  constructor() {
    this.ws = null;
    this.listeners = {};
    this.ref = 1;
    this.topic = 'realtime:tracker_live';
    this.isConnected = false;
    this.heartbeatTimer = null;
    this.connect();
  }

  connect() {
    try {
      const wsUrl = `${SUPABASE_URL.replace(/^http/, 'ws')}/realtime/v1/websocket?apikey=${SUPABASE_KEY}&vsn=1.0.0`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        // Join room channel
        this.send({
          topic: this.topic,
          event: 'phx_join',
          payload: {
            config: {
              broadcast: { ack: false, self: false },
              presence: { key: '' }
            }
          },
          ref: String(this.ref++)
        });

        // Start heartbeat every 25 seconds
        if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.send({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: String(this.ref++) });
          }
        }, 25000);
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event === 'broadcast' && msg.payload && msg.payload.event) {
            const innerEvent = msg.payload.event;
            const innerPayload = msg.payload.payload;
            if (this.listeners[innerEvent]) {
              this.listeners[innerEvent].forEach(cb => cb(innerPayload));
            }
          }
        } catch (e) {
          console.error('[TrackerRealtime] Message parse error:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
        setTimeout(() => this.connect(), 3000); // Reconnect
      };

      this.ws.onerror = (err) => {
        console.warn('[TrackerRealtime] WebSocket error:', err);
      };
    } catch (e) {
      console.warn('[TrackerRealtime] Connection failed:', e);
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  emit(eventName, payload) {
    this.send({
      topic: this.topic,
      event: 'broadcast',
      payload: {
        type: 'broadcast',
        event: eventName,
        payload: payload
      },
      ref: String(this.ref++)
    });
  }

  on(eventName, callback) {
    if (!this.listeners[eventName]) this.listeners[eventName] = [];
    this.listeners[eventName].push(callback);
  }

  off(eventName, callback) {
    if (!this.listeners[eventName]) return;
    this.listeners[eventName] = this.listeners[eventName].filter(cb => cb !== callback);
  }

  disconnect() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Global singleton instance for live collaboration
export const realtimeTracker = new TrackerRealtime();

// Compatible mock for socket.io-like API so existing code works seamlessly
export const createTrackerSocket = () => {
  return {
    id: 'client-' + Math.random().toString(36).substring(2, 9),
    on: (evt, cb) => realtimeTracker.on(evt, cb),
    emit: (evt, data) => realtimeTracker.emit(evt, data),
    off: (evt, cb) => realtimeTracker.off(evt, cb),
    disconnect: () => {}
  };
};

export { SUPABASE_URL, SUPABASE_KEY };
