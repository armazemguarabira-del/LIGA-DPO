import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

// Ensure data directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const app = express();
const server = http.createServer(app);

// Increase JSON body limits for high-resolution photo uploads (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Statically serve uploaded photos
app.use('/uploads', express.static(UPLOADS_DIR));

// WebSocket Server on the same HTTP server
const wss = new WebSocketServer({ server, path: '/ws' });

interface BroadcastEvent {
  type: string;
  payload?: any;
  timestamp: string;
}

function broadcast(event: BroadcastEvent) {
  const message = JSON.stringify(event);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (err) {
        console.error('Failed to send WS message:', err);
      }
    }
  });
}

wss.on('connection', (ws: WebSocket) => {
  // Send current database state to newly connected client
  try {
    const dbData = loadDatabase();
    ws.send(
      JSON.stringify({
        type: 'INITIAL_SYNC',
        payload: dbData,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (e) {
    console.error('Error sending initial sync:', e);
  }

  ws.on('message', (data: string) => {
    try {
      const parsed = JSON.parse(data.toString());
      if (parsed.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG' }));
      }
    } catch {
      // ignore
    }
  });
});

// Atomic database file reading and writing
function loadDatabase(): any {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Error reading database file, fallback to empty:', e);
    }
  }
  return null;
}

function saveDatabase(data: any): boolean {
  try {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (e) {
    console.error('Error writing database file:', e);
    return false;
  }
}

// REST API Endpoints

// 1. Get database state
app.get('/api/db', (_req, res) => {
  const db = loadDatabase();
  res.json({ success: true, data: db });
});

// 2. Save complete database state and broadcast to all connected clients
app.post('/api/db', (req, res) => {
  const { data, reason } = req.body;
  if (!data) {
    return res.status(400).json({ success: false, error: 'Data payload is required' });
  }

  const success = saveDatabase(data);
  if (success) {
    broadcast({
      type: 'DATABASE_UPDATED',
      payload: { data, reason: reason || 'Database updated' },
      timestamp: new Date().toISOString(),
    });
    return res.json({ success: true });
  } else {
    return res.status(500).json({ success: false, error: 'Failed to save database' });
  }
});

// 3. Upload photo endpoint: Saves base64 photo to disk and returns a persistent URL
app.post('/api/upload', (req, res) => {
  try {
    const { imageBase64, filenamePrefix } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'imageBase64 is required' });
    }

    // Extract base64 content and extension
    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    let extension = 'jpg';

    if (matches && matches.length === 3) {
      const mime = matches[1];
      if (mime.includes('png')) extension = 'png';
      else if (mime.includes('webp')) extension = 'webp';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(imageBase64, 'base64');
    }

    const prefix = filenamePrefix ? filenamePrefix.replace(/[^a-z0-9_-]/gi, '') : 'photo';
    const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${fileName}`;
    return res.json({ success: true, url: fileUrl });
  } catch (err: any) {
    console.error('Error saving uploaded photo:', err);
    return res.status(500).json({ success: false, error: err.message || 'Upload failed' });
  }
});

// 4. Healthcheck & Metadata
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    clientsConnected: wss.clients.size,
    dbExists: fs.existsSync(DB_FILE),
    timestamp: new Date().toISOString(),
  });
});

// Vite Middleware integration in dev, Static serving in prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production' || process.env.npm_lifecycle_event === 'start';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    } else {
      console.warn('Production build dist/ not found, please run npm run build');
    }
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Liga DPO Armazém Server running on http://0.0.0.0:${PORT}`);
    console.log(`📡 WebSocket real-time server mounted at ws://0.0.0.0:${PORT}/ws`);
    console.log(`💾 Persistent database file: ${DB_FILE}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
