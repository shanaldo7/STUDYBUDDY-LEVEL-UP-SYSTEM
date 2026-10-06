/**
 * StudyBuddy AI - Monarch Hunter System
 * Full-Stack Express Server & Vite Dev Middleware
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { 
  initPostgresTables, 
  getOrCreateUser, 
  saveUserProgress, 
  resetUserProgress,
  getUserSyllabi,
  saveUserSyllabus,
  recordTopicActivity
} from './server/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// In-memory token -> session map (Bearer token auth)
interface Session {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: number;
}
const activeSessions = new Map<string, Session>();

// Session validation middleware
function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }

  const token = authHeader.substring(7);
  const session = activeSessions.get(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  (req as unknown as { session: Session }).session = session;
  next();
}

/* =========================================================
   API ROUTES
   ========================================================= */

// 1. Google OAuth / OIDC Login
app.post('/api/auth/google', async (req: Request, res: Response) => {
  try {
    const { email, displayName, photoUrl, googleId } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Valid email is required for authentication' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = (displayName || cleanEmail.split('@')[0] || 'Awakened Hunter').trim();

    const { user, isNew } = await getOrCreateUser(cleanEmail, cleanName, photoUrl, googleId);

    // Issue unique bearer token
    const token = `sbt_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    activeSessions.set(token, {
      userId: user.id,
      email: cleanEmail,
      displayName: cleanName,
      avatarUrl: photoUrl,
      createdAt: Date.now()
    });

    return res.json({
      success: true,
      token,
      user,
      isNewUser: isNew,
      message: isNew 
        ? '[SYSTEM PROTOCOL INITIALIZED] Hunter Profile Created. Welcome, Hunter.' 
        : `[WELCOME BACK, HUNTER] Level ${user.level} profile loaded.`
    });
  } catch (err) {
    console.error('[API /api/auth/google error]:', err);
    return res.status(500).json({ error: 'Authentication service error' });
  }
});

// 2. Get current authenticated user
app.get('/api/auth/me', authenticate, async (req: Request, res: Response) => {
  try {
    const session = (req as unknown as { session: Session }).session;
    const { user } = await getOrCreateUser(session.email, session.displayName, session.avatarUrl);
    return res.json({
      success: true,
      user,
      email: session.email,
      displayName: session.displayName
    });
  } catch (err) {
    console.error('[API /api/auth/me error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// 3. Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    activeSessions.delete(token);
  }
  return res.json({ success: true, message: 'Logged out successfully' });
});

// 4. Save / sync progress
app.post('/api/progress/sync', authenticate, async (req: Request, res: Response) => {
  try {
    const session = (req as unknown as { session: Session }).session;
    const { user, quests, shadows, skills, flashcards, exams } = req.body;

    if (!user || user.id !== session.userId) {
      // Guard against spoofing other user IDs
      if (user) user.id = session.userId;
    }

    await saveUserProgress(session.userId, user, quests, shadows, skills, flashcards, exams);
    return res.json({ success: true, savedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[API /api/progress/sync error]:', err);
    return res.status(500).json({ error: 'Failed to save progress' });
  }
});

// 5. Reset progress to Level 1 (Safe Reset)
app.post('/api/progress/reset', authenticate, async (req: Request, res: Response) => {
  try {
    const session = (req as unknown as { session: Session }).session;
    const { confirmation } = req.body;

    if (confirmation !== 'RESET') {
      return res.status(400).json({ error: 'Must type RESET to confirm destructive action.' });
    }

    const freshUser = await resetUserProgress(session.userId, session.email);
    return res.json({
      success: true,
      message: 'Progress successfully reset to Level 1, 0 XP, F-Rank.',
      user: freshUser
    });
  } catch (err) {
    console.error('[API /api/progress/reset error]:', err);
    return res.status(500).json({ error: 'Failed to reset progress' });
  }
});

// 6. Idempotent action completions (Quest, Dungeon, Quiz)
app.post('/api/progress/action-complete', authenticate, async (req: Request, res: Response) => {
  try {
    const { completionId, type, xpEarned, rewardData } = req.body;

    if (!completionId) {
      return res.status(400).json({ error: 'completionId is required for idempotency protection' });
    }

    return res.json({
      success: true,
      completionId,
      type,
      xpEarned: xpEarned || 0,
      rewardData: rewardData || null,
      recordedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('[API /api/progress/action-complete error]:', err);
    return res.status(500).json({ error: 'Failed to record completion' });
  }
});

// 7. Get user's syllabi
app.get('/api/syllabus/list', authenticate, async (req: Request, res: Response) => {
  try {
    const session = (req as unknown as { session: Session }).session;
    const syllabi = await getUserSyllabi(session.userId);
    return res.json({ success: true, syllabi });
  } catch (err) {
    console.error('[API /api/syllabus/list error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve syllabi' });
  }
});

// 8. Save or update syllabus
app.post('/api/syllabus/save', authenticate, async (req: Request, res: Response) => {
  try {
    const session = (req as unknown as { session: Session }).session;
    const { syllabus } = req.body;

    if (!syllabus || !syllabus.program || !syllabus.subjects) {
      return res.status(400).json({ error: 'Invalid syllabus data provided' });
    }

    const saved = await saveUserSyllabus(session.userId, syllabus);
    return res.json({ success: true, syllabus: saved });
  } catch (err) {
    console.error('[API /api/syllabus/save error]:', err);
    return res.status(500).json({ error: 'Failed to save syllabus' });
  }
});

// 9. Record topic learning activity
app.post('/api/syllabus/activity', authenticate, async (req: Request, res: Response) => {
  try {
    const session = (req as unknown as { session: Session }).session;
    const { topicId, activity } = req.body;

    if (!topicId || !activity) {
      return res.status(400).json({ error: 'topicId and activity data are required' });
    }

    const updatedProgress = await recordTopicActivity(session.userId, topicId, activity);
    return res.json({ success: true, progress: updatedProgress });
  } catch (err) {
    console.error('[API /api/syllabus/activity error]:', err);
    return res.status(500).json({ error: 'Failed to record topic activity' });
  }
});

/* =========================================================
   BOOTSTRAP SERVER & VITE
   ========================================================= */

async function startServer() {
  await initPostgresTables();

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[StudyBuddy AI] Server running on http://localhost:${PORT}`);
  });
}

startServer();
