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

// ─── Privacy Policy ──────────────────────────────────────────────────
app.get('/privacy', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - QUP Training</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 0 auto; padding: 24px; color: #222; line-height: 1.7; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    h2 { font-size: 18px; margin-top: 32px; }
    p, li { font-size: 15px; }
    ul { padding-left: 20px; }
    .updated { color: #666; font-size: 14px; margin-bottom: 32px; }
  </style>
</head>
<body>
  <h1>Privacy Policy for QUP Training</h1>
  <p class="updated">Last updated: January 2026</p>
  <h2>1. Introduction</h2>
  <p>QUP ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application ("the App").</p>
  <h2>2. Information We Collect</h2>
  <p>We may collect:</p>
  <ul>
    <li>Profile information you choose to provide</li>
    <li>Messages or content you send in the app</li>
    <li>Device information (model, OS version, identifiers)</li>
    <li>Usage data (interactions, crash logs)</li>
    <li>Approximate location if required for app functionality</li>
  </ul>
  <p>We do not collect sensitive personal data unless you explicitly provide it.</p>
  <h2>3. How We Use Your Information</h2>
  <p>We use your information to:</p>
  <ul>
    <li>Operate and improve the app</li>
    <li>Enhance performance and stability</li>
    <li>Communicate with you about updates or support</li>
    <li>Prevent misuse and ensure safety</li>
  </ul>
  <p>We do not sell your data.</p>
  <h2>4. Sharing of Information</h2>
  <p>We may share information only with:</p>
  <ul>
    <li>Service providers (analytics, crash reporting)</li>
    <li>Legal authorities if required by law</li>
    <li>To protect the rights and safety of users</li>
  </ul>
  <p>We do not share data for advertising.</p>
  <h2>5. Data Security</h2>
  <p>We use reasonable technical and organizational measures to protect your data. No method is 100% secure.</p>
  <h2>6. Children's Privacy</h2>
  <p>QUP Training is not intended for children under 18. We do not knowingly collect data from children under 18.</p>
  <h2>7. Your Rights</h2>
  <p>You may request:</p>
  <ul>
    <li>Access to your data</li>
    <li>Correction or deletion</li>
    <li>Withdrawal of consent</li>
  </ul>
  <p>Contact us using the email below.</p>
  <h2>8. Third-Party Services</h2>
  <p>The app may use third-party tools such as analytics or crash reporting. These services follow their own privacy policies.</p>
  <h2>9. Changes to This Policy</h2>
  <p>We may update this Privacy Policy. The latest version will always be available at this URL.</p>
  <h2>10. Contact Us</h2>
  <p>Email: qup.dating@gmail.com<br>Company: QUP DA<br>Country: Norway</p>
</body>
</html>`);
});


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