import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB } from './db.js';
import { attachSocketIO } from './socketServer.js';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import gradeRoutes from './routes/grades.js';
import archiveRoutes from './routes/archive.js';
import userRoutes from './routes/users.js';
import roleRoutes from './routes/roles.js';
import templateRoutes from './routes/templates.js';
import subjectRoutes from './routes/subjects.js';
import chatRoutes from './routes/chat.js';
import notificationRoutes from './routes/notifications.js';
import cameraRoutes from './routes/camera.js';
import councilSessionRoutes from './routes/council-sessions.js';
import bulletinRemarksRoutes from './routes/bulletin-remarks.js';
import classTeachersRoutes from './routes/class-teachers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const DEV_ORIGIN = 'http://localhost:5173';

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// CORS pour dev (Vite sur port 5173)
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({ origin: DEV_ORIGIN, credentials: true }));
}

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/archive', archiveRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/camera', cameraRoutes);
app.use('/api/council-sessions', councilSessionRoutes);
app.use('/api/bulletin-remarks', bulletinRemarksRoutes);
app.use('/api/class-teachers', classTeachersRoutes);

// Servir les photos uploadées (accessibles via /uploads/...)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Servir le frontend buildé en production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

// Créer le serveur HTTP + attacher Socket.IO
const httpServer = attachSocketIO(
  app,
  process.env.NODE_ENV !== 'production' ? DEV_ORIGIN : undefined,
);

initDB().then(() => {
  httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('DB init failed:', err);
  process.exit(1);
});
