import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Database connection
const dbPath = path.join(__dirname, '../../data/archive.db');
const db = new Database(dbPath);

// Configure Passport Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'dummy-client-id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-client-secret',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;

      // Check domain restriction if configured
      const allowedDomainConfig = db.prepare('SELECT value FROM config WHERE key = ?').get('allowed_domain');
      const allowedDomain = allowedDomainConfig?.value;

      if (allowedDomain && !email.endsWith(`@${allowedDomain}`)) {
        return done(null, false, { message: `Only ${allowedDomain} emails are allowed` });
      }

      // Check if user exists
      let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(profile.id);

      if (!user) {
        // Create new user
        const stmt = db.prepare(`
          INSERT INTO users (google_id, email, name, avatar_url, role, created_at, last_login)
          VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `);

        const result = stmt.run(
          profile.id,
          email,
          profile.displayName,
          profile.photos?.[0]?.value || null,
          'user' // Default role
        );

        user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      } else {
        // Update last login
        db.prepare('UPDATE users SET last_login = datetime(\'now\') WHERE id = ?').run(user.id);
      }

      return done(null, user);
    } catch (error) {
      console.error('Google auth error:', error);
      return done(error);
    }
  }
));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser((id, done) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    done(null, user || null);
  } catch (error) {
    done(error);
  }
});

// GET /auth/google - Initiate Google OAuth flow
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// GET /auth/google/callback - OAuth callback handler
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login?error=auth_failed'
  }),
  (req, res) => {
    // Successful authentication
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
  }
);

// GET /auth/me - Get current user info
router.get('/me', (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Not authenticated'
      }
    });
  }

  // Return user info (without sensitive data)
  const { google_id, ...userInfo } = req.user;
  res.json({
    success: true,
    data: userInfo
  });
});

// Development-only test login route
// This allows testing authentication without Google OAuth
if (process.env.NODE_ENV !== 'production') {
  router.post('/dev-login', (req, res) => {
    const { role = 'user' } = req.body;

    // Check if test user exists
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(`test-${role}@dev.local`);

    if (!user) {
      // Create test user
      const stmt = db.prepare(`
        INSERT INTO users (google_id, email, name, avatar_url, role, created_at, last_login)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `);

      const result = stmt.run(
        `dev-${role}-${Date.now()}`,
        `test-${role}@dev.local`,
        `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        null,
        role
      );

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    } else {
      // Update last login
      db.prepare('UPDATE users SET last_login = datetime(\'now\') WHERE id = ?').run(user.id);
    }

    // Log in the user
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: { code: 'LOGIN_FAILED', message: 'Failed to login' }
        });
      }

      const { google_id, ...userInfo } = user;
      res.json({
        success: true,
        data: userInfo
      });
    });
  });
}

// POST /auth/logout - Logout user
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'LOGOUT_FAILED',
          message: 'Failed to logout'
        }
      });
    }

    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
      res.clearCookie('connect.sid');
      res.json({
        success: true,
        data: { message: 'Logged out successfully' }
      });
    });
  });
});

// Middleware to check if user is authenticated
export function isAuthenticated(req, res, next) {
  if (req.isAuthenticated() && req.user) {
    return next();
  }

  return res.status(401).json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    }
  });
}

// Middleware to check if user is admin
export function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user && req.user.role === 'admin') {
    return next();
  }

  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }
    });
  }

  return res.status(403).json({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'Admin access required'
    }
  });
}

export default router;
