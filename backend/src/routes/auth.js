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

      if (allowedDomain) {
        // Extract domain from email (part after @)
        const emailDomain = email.split('@')[1]?.toLowerCase();
        const normalizedAllowedDomain = allowedDomain.replace(/^@/, '').toLowerCase();

        // Check if email domain matches exactly OR is a subdomain of the allowed domain
        const domainMatches = emailDomain === normalizedAllowedDomain ||
                             emailDomain?.endsWith(`.${normalizedAllowedDomain}`);

        if (!domainMatches) {
          return done(null, false, { message: `Only ${allowedDomain} emails are allowed` });
        }
      }

      // Check if user exists by google_id or email
      let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(profile.id);

      if (!user) {
        // Check if user exists by email (case-insensitive for pre-created admin users)
        user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);

        if (user) {
          // Update existing user with Google info
          db.prepare(`
            UPDATE users
            SET google_id = ?, name = ?, avatar_url = ?, last_login = datetime('now')
            WHERE id = ?
          `).run(profile.id, profile.displayName, profile.photos?.[0]?.value || null, user.id);

          user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
        } else {
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
        }
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
router.get('/google/callback', (req, res, next) => {
  console.log('OAuth callback received, attempting authentication...');
  console.log('Callback URL configured:', process.env.GOOGLE_CALLBACK_URL);

  passport.authenticate('google', (err, user, info) => {
    console.log('Passport authenticate callback:');
    console.log('  - Error:', err);
    console.log('  - User:', user?.email || user);
    console.log('  - Info:', info);

    if (err) {
      console.error('OAuth error:', err);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3801'}/login?error=oauth_error`);
    }

    if (!user) {
      console.error('No user returned from OAuth. Info:', info);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3801'}/login?error=no_user`);
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        console.error('Login error:', loginErr);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3801'}/login?error=login_failed`);
      }

      console.log('OAuth callback success - User:', user.email, 'Session ID:', req.sessionID);

      // Ensure session is saved before redirect
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('Session save error:', saveErr);
          return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3801'}/login?error=session_failed`);
        }
        console.log('Session saved successfully, redirecting to frontend');
        res.redirect(process.env.FRONTEND_URL || 'http://localhost:3801');
      });
    });
  })(req, res, next);
});

// GET /auth/me - Get current user info
router.get('/me', (req, res) => {
  // Debug: Log session state
  console.log('GET /auth/me - Session ID:', req.sessionID);
  console.log('GET /auth/me - Cookies:', req.headers.cookie);
  console.log('GET /auth/me - isAuthenticated:', req.isAuthenticated());
  console.log('GET /auth/me - User:', req.user?.email);

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

// Check if dev login is enabled
const devLoginEnabled = process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEV_LOGIN === 'true';

// GET /auth/dev-login-status - Check if dev login is available
router.get('/dev-login-status', (req, res) => {
  res.json({
    success: true,
    data: { enabled: devLoginEnabled }
  });
});

// Development/test login route
// This allows testing authentication without Google OAuth
// Enable with ENABLE_DEV_LOGIN=true or in non-production environments
if (devLoginEnabled) {
  router.post('/dev-login', (req, res) => {
    const { role = 'user', userId } = req.body;

    // Support both role-based login and specific user ID login
    const email = userId ? `test-${role}-${userId}@dev.local` : `test-${role}@dev.local`;
    const name = userId ? `Test ${role.charAt(0).toUpperCase() + role.slice(1)} ${userId}` : `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`;

    // Check if test user exists
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      // Create test user
      const stmt = db.prepare(`
        INSERT INTO users (google_id, email, name, avatar_url, role, created_at, last_login)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `);

      const result = stmt.run(
        `dev-${role}-${userId || Date.now()}`,
        email,
        name,
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

// PUT /auth/preferences - Update notification preferences
router.put('/preferences', (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Not authenticated'
      }
    });
  }

  const { notify_new_works, notify_comments } = req.body;

  try {
    db.prepare(`
      UPDATE users
      SET notify_new_works = ?, notify_comments = ?
      WHERE id = ?
    `).run(
      notify_new_works ? 1 : 0,
      notify_comments ? 1 : 0,
      req.user.id
    );

    // Fetch updated user
    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const { google_id, ...userInfo } = updatedUser;

    res.json({
      success: true,
      data: userInfo
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: 'Failed to update preferences'
      }
    });
  }
});

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
