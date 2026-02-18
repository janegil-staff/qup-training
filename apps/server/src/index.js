import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { startNotificationCron } from './cron/dailyNotifications.js';

const app = express();
const httpServer = createServer(app);

// ─── Socket.io ───────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingInterval: 25000,
  pingTimeout: 60000,
});

// Track online users: userId -> Set of socketIds
const onlineUsers = new Map();

// Auth middleware for sockets
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('No token'));
  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    socket.userId = decoded.userId;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.userId;
  console.log(`⚡ Connected: ${userId} (${socket.id})`);

  // Track online
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socket.id);
  socket.join(`user:${userId}`);
  io.emit('user:online', { userId, online: true });

  // Typing indicators
  socket.on('typing', ({ targetUserId }) => {
    io.to(`user:${targetUserId}`).emit('user:typing', { userId });
  });
  socket.on('stopTyping', ({ targetUserId }) => {
    io.to(`user:${targetUserId}`).emit('user:stopTyping', { userId });
  });

  // Workout events
  socket.on('workout:started', (data) => {
    socket.broadcast.emit('workout:live', { userId, ...data });
  });
  socket.on('workout:completed', (data) => {
    socket.broadcast.emit('workout:completed', { userId, ...data });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`⚡ Disconnected: ${userId} (${socket.id})`);
    const sockets = onlineUsers.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        onlineUsers.delete(userId);
        io.emit('user:online', { userId, online: false });
      }
    }
  });
});

// Make io available in controllers via req.app.get('io')
app.set('io', io);
app.set('onlineUsers', onlineUsers);

// ─── Middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── Health ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({
  status: 'ok',
  timestamp: new Date(),
  onlineUsers: onlineUsers.size,
}));

// ─── 404 + Error ─────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ───────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();
  startNotificationCron();

  httpServer.listen(env.port, () => {
    console.log(`\n🚀 QUP Training server on port ${env.port}`);
    console.log(`   API:    http://localhost:${env.port}/api`);
    console.log(`   Socket: ws://localhost:${env.port}\n`);
  });
};

start();
export { io };