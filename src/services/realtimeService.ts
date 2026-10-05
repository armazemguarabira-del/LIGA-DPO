type EventCallback = (event: { type: string; payload?: any }) => void;

class RealtimeService {
  private ws: WebSocket | null = null;
  private subscribers: Set<EventCallback> = new Set();
  private reconnectTimeout: any = null;
  private isConnected = false;
  private hasInitialized = false;
  private isNotifying = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  public connect() {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log('⚡ Conectado ao servidor de sincronização em tempo real (Liga DPO)');
        this.notifySubscribers({ type: 'CONNECTION_STATUS', payload: { connected: true } });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifySubscribers(data);
        } catch (e) {
          console.error('Erro ao processar mensagem do WebSocket:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notifySubscribers({ type: 'CONNECTION_STATUS', payload: { connected: false } });
        // Auto-reconnect after 3 seconds
        if (!this.reconnectTimeout) {
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.connect();
          }, 3000);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket connection error (will retry):', err);
        this.ws?.close();
      };
    } catch (err) {
      console.error('Falha ao iniciar WebSocket:', err);
    }
  }

  public subscribe(cb: EventCallback): () => void {
    this.subscribers.add(cb);
    return () => {
      this.subscribers.delete(cb);
    };
  }

  private notifySubscribers(event: { type: string; payload?: any }) {
    if (this.isNotifying) {
      console.warn('⚡ Notificação recursiva bloqueada em tempo real para:', event.type);
      return;
    }
    this.isNotifying = true;
    try {
      this.subscribers.forEach((cb) => {
        try {
          cb(event);
        } catch (err) {
          console.error('Erro em subscriber de tempo real:', err, (err as any)?.stack);
        }
      });
    } finally {
      this.isNotifying = false;
    }
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  // Upload photo to the server filesystem: avoids localStorage 5MB quota errors
  public async uploadPhoto(imageBase64: string, prefix = 'photo'): Promise<string> {
    if (!imageBase64.startsWith('data:image')) {
      // already a URL or path
      return imageBase64;
    }

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, filenamePrefix: prefix }),
      });

      if (!res.ok) {
        throw new Error(`Upload failed with status ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.url) {
        return data.url;
      }
    } catch (err) {
      console.warn('Falha no upload para servidor, mantendo fallback base64:', err);
    }

    return imageBase64;
  }

  // Push complete database state to the server database.json and broadcast to all users
  public async pushDatabase(dbPayload: any, reason = 'Atualização Operacional'): Promise<boolean> {
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dbPayload, reason }),
      });
      const json = await res.json();
      return !!json.success;
    } catch (err) {
      console.error('Erro ao sincronizar base de dados com servidor:', err);
      return false;
    }
  }

  // Pull database state from server
  public async pullDatabase(): Promise<any | null> {
    try {
      const res = await fetch('/api/db');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn('Não foi possível obter dados do servidor:', err);
    }
    return null;
  }
}

export const realtimeService = new RealtimeService();
