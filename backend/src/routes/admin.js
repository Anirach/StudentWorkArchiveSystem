import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { isAuthenticated, isAdmin } from './auth.js';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Database connection
const dbPath = path.join(__dirname, '../../data/archive.db');
const db = new Database(dbPath);

// All admin routes require authentication and admin role
router.use(isAuthenticated);
router.use(isAdmin);

// === ANALYTICS ===

// GET /admin/analytics - Get analytics data
router.get('/analytics', (req, res) => {
  try {
    const { range = '7d' } = req.query;

    // Calculate date range
    let daysAgo = 7;
    switch (range) {
      case '30d': daysAgo = 30; break;
      case '90d': daysAgo = 90; break;
      case '1y': daysAgo = 365; break;
      default: daysAgo = 7;
    }

    // Get totals
    const totalWorks = db.prepare('SELECT COUNT(*) as count FROM works').get().count;
    const totalViews = db.prepare('SELECT COALESCE(SUM(view_count), 0) as count FROM works').get().count;
    const totalDownloads = db.prepare('SELECT COALESCE(SUM(download_count), 0) as count FROM works').get().count;
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

    // Get top viewed works
    const topWorks = db.prepare(`
      SELECT id, title, view_count
      FROM works
      ORDER BY view_count DESC
      LIMIT 10
    `).all();

    // Get top rated works
    const topRated = db.prepare(`
      SELECT w.id, w.title, AVG(v.stars) as avg_rating, COUNT(v.id) as vote_count
      FROM works w
      LEFT JOIN votes v ON w.id = v.work_id
      GROUP BY w.id
      HAVING vote_count > 0
      ORDER BY avg_rating DESC, vote_count DESC
      LIMIT 10
    `).all();

    // Get trend data from activity_logs (views and downloads over time)
    const trendData = db.prepare(`
      SELECT
        DATE(created_at) as date,
        SUM(CASE WHEN action = 'view' THEN 1 ELSE 0 END) as views,
        SUM(CASE WHEN action = 'download' THEN 1 ELSE 0 END) as downloads
      FROM activity_logs
      WHERE created_at >= datetime('now', '-${daysAgo} days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all();

    // Get category distribution (works per category)
    const categoryDistribution = db.prepare(`
      SELECT
        c.name,
        COUNT(w.id) as count
      FROM categories c
      LEFT JOIN works w ON c.id = w.category_id
      GROUP BY c.id
      HAVING count > 0
      ORDER BY count DESC
    `).all();

    res.success({
      totalWorks,
      totalViews,
      totalDownloads,
      totalUsers,
      topWorks,
      topRated,
      trendData,
      categoryDistribution
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.error('Failed to fetch analytics', 'ERROR', 500);
  }
});

// === CONFIG ===

// GET /admin/config - Get system configuration
router.get('/config', (req, res) => {
  try {
    const configs = db.prepare('SELECT key, value, description FROM config').all();
    const configObj = {};
    configs.forEach(c => {
      configObj[c.key] = { value: c.value, description: c.description };
    });
    res.success(configObj);
  } catch (error) {
    console.error('Error fetching config:', error);
    res.error('Failed to fetch configuration', 'ERROR', 500);
  }
});

// PUT /admin/config - Update configuration
router.put('/config', (req, res) => {
  try {
    const updates = req.body;

    const updateStmt = db.prepare(`
      UPDATE config SET value = ?, updated_at = datetime('now')
      WHERE key = ?
    `);

    const updated = [];
    for (const [key, value] of Object.entries(updates)) {
      const result = updateStmt.run(value, key);
      if (result.changes > 0) {
        updated.push(key);
      }
    }

    res.success({ message: 'Configuration updated', updated });
  } catch (error) {
    console.error('Error updating config:', error);
    res.error('Failed to update configuration', 'ERROR', 500);
  }
});

// === WORKS ===

// Helper function to convert values for SQLite
const toSqlite = (value, type = 'string') => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (type === 'int') {
    const parsed = parseInt(value);
    return isNaN(parsed) ? null : parsed;
  }
  if (type === 'bool') {
    return value ? 1 : 0;
  }
  return String(value);
};

// POST /admin/works - Create new work
router.post('/works', (req, res) => {
  try {
    const {
      title,
      description,
      author_name,
      author_email,
      academic_year,
      work_type_id,
      category_id,
      google_file_id,
      file_url,
      thumbnail_url,
      file_size,
      page_count,
      is_featured = false,
      is_public = true,
      tags = []
    } = req.body;

    if (!title || !title.trim()) {
      return res.error('Title is required', 'VALIDATION_ERROR', 400);
    }

    // Generate share token
    const share_token = crypto.randomBytes(16).toString('hex');

    const insertStmt = db.prepare(`
      INSERT INTO works (
        title, description, author_name, author_email, academic_year,
        work_type_id, category_id, google_file_id, file_url, thumbnail_url,
        file_size, page_count, is_featured, is_public, share_token,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    const result = insertStmt.run(
      toSqlite(title),
      toSqlite(description),
      toSqlite(author_name),
      toSqlite(author_email),
      toSqlite(academic_year),
      toSqlite(work_type_id, 'int'),
      toSqlite(category_id, 'int'),
      toSqlite(google_file_id),
      toSqlite(file_url),
      toSqlite(thumbnail_url),
      toSqlite(file_size, 'int'),
      toSqlite(page_count, 'int'),
      toSqlite(is_featured, 'bool'),
      toSqlite(is_public, 'bool'),
      share_token
    );

    const workId = result.lastInsertRowid;

    // Add tags
    if (tags.length > 0) {
      const tagStmt = db.prepare('INSERT INTO work_tags (work_id, tag_id) VALUES (?, ?)');
      for (const tagId of tags) {
        tagStmt.run(workId, tagId);
      }
    }

    const work = db.prepare('SELECT * FROM works WHERE id = ?').get(workId);
    res.success(work);
  } catch (error) {
    console.error('Error creating work:', error);
    res.error('Failed to create work', 'ERROR', 500);
  }
});

// PUT /admin/works/:id - Update work
router.put('/works/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      author_name,
      author_email,
      academic_year,
      work_type_id,
      category_id,
      google_file_id,
      file_url,
      is_featured,
      is_public,
      tags
    } = req.body;

    // Check if work exists
    const existing = db.prepare('SELECT id FROM works WHERE id = ?').get(id);
    if (!existing) {
      return res.error('Work not found', 'NOT_FOUND', 404);
    }

    const updateStmt = db.prepare(`
      UPDATE works SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        author_name = COALESCE(?, author_name),
        author_email = COALESCE(?, author_email),
        academic_year = COALESCE(?, academic_year),
        work_type_id = COALESCE(?, work_type_id),
        category_id = COALESCE(?, category_id),
        google_file_id = COALESCE(?, google_file_id),
        file_url = COALESCE(?, file_url),
        is_featured = COALESCE(?, is_featured),
        is_public = COALESCE(?, is_public),
        updated_at = datetime('now')
      WHERE id = ?
    `);

    updateStmt.run(
      toSqlite(title),
      toSqlite(description),
      toSqlite(author_name),
      toSqlite(author_email),
      toSqlite(academic_year),
      toSqlite(work_type_id, 'int'),
      toSqlite(category_id, 'int'),
      toSqlite(google_file_id),
      toSqlite(file_url),
      is_featured !== undefined ? toSqlite(is_featured, 'bool') : null,
      is_public !== undefined ? toSqlite(is_public, 'bool') : null,
      id
    );

    // Update tags if provided
    if (tags !== undefined) {
      db.prepare('DELETE FROM work_tags WHERE work_id = ?').run(id);
      if (tags.length > 0) {
        const tagStmt = db.prepare('INSERT INTO work_tags (work_id, tag_id) VALUES (?, ?)');
        for (const tagId of tags) {
          tagStmt.run(id, tagId);
        }
      }
    }

    const work = db.prepare('SELECT * FROM works WHERE id = ?').get(id);
    res.success(work);
  } catch (error) {
    console.error('Error updating work:', error);
    res.error('Failed to update work', 'ERROR', 500);
  }
});

// DELETE /admin/works/:id - Delete work
router.delete('/works/:id', (req, res) => {
  try {
    const { id } = req.params;

    // Check if work exists
    const existing = db.prepare('SELECT id FROM works WHERE id = ?').get(id);
    if (!existing) {
      return res.error('Work not found', 'NOT_FOUND', 404);
    }

    // Delete related data first
    db.prepare('DELETE FROM work_tags WHERE work_id = ?').run(id);
    db.prepare('DELETE FROM votes WHERE work_id = ?').run(id);
    db.prepare('DELETE FROM comments WHERE work_id = ?').run(id);
    db.prepare('DELETE FROM favorites WHERE work_id = ?').run(id);
    db.prepare('DELETE FROM activity_logs WHERE work_id = ?').run(id);

    // Delete work
    db.prepare('DELETE FROM works WHERE id = ?').run(id);

    res.success({ message: 'Work deleted' });
  } catch (error) {
    console.error('Error deleting work:', error);
    res.error('Failed to delete work', 'ERROR', 500);
  }
});

// POST /admin/works/:id/feature - Toggle featured status
router.post('/works/:id/feature', (req, res) => {
  try {
    const { id } = req.params;

    const work = db.prepare('SELECT is_featured FROM works WHERE id = ?').get(id);
    if (!work) {
      return res.error('Work not found', 'NOT_FOUND', 404);
    }

    const newStatus = work.is_featured ? 0 : 1;
    db.prepare('UPDATE works SET is_featured = ?, updated_at = datetime(\'now\') WHERE id = ?').run(newStatus, id);

    res.success({
      message: newStatus ? 'Work featured' : 'Work unfeatured',
      is_featured: newStatus
    });
  } catch (error) {
    console.error('Error toggling featured:', error);
    res.error('Failed to toggle featured status', 'ERROR', 500);
  }
});

// === CATEGORIES ===

// PUT /admin/categories/reorder - Reorder categories (must be before :id route)
router.put('/categories/reorder', (req, res) => {
  try {
    const { categories } = req.body;

    if (!Array.isArray(categories)) {
      return res.error('Categories array is required', 'VALIDATION_ERROR', 400);
    }

    const updateStmt = db.prepare('UPDATE categories SET sort_order = ? WHERE id = ?');

    const updateMany = db.transaction((items) => {
      for (const item of items) {
        updateStmt.run(item.sort_order, item.id);
      }
    });

    updateMany(categories);

    res.success({ message: 'Categories reordered successfully' });
  } catch (error) {
    console.error('Error reordering categories:', error);
    res.error('Failed to reorder categories', 'ERROR', 500);
  }
});

// POST /admin/categories - Create category
router.post('/categories', (req, res) => {
  try {
    const { name, description, parent_id, sort_order = 0 } = req.body;

    if (!name || !name.trim()) {
      return res.error('Category name is required', 'VALIDATION_ERROR', 400);
    }

    const insertStmt = db.prepare(`
      INSERT INTO categories (name, description, parent_id, sort_order, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `);

    const result = insertStmt.run(name, description, parent_id, sort_order);
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);

    res.success(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.error('Failed to create category', 'ERROR', 500);
  }
});

// PUT /admin/categories/:id - Update category
router.put('/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parent_id, sort_order } = req.body;

    const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
    if (!existing) {
      return res.error('Category not found', 'NOT_FOUND', 404);
    }

    const updateStmt = db.prepare(`
      UPDATE categories SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        parent_id = COALESCE(?, parent_id),
        sort_order = COALESCE(?, sort_order)
      WHERE id = ?
    `);

    updateStmt.run(name, description, parent_id, sort_order, id);
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);

    res.success(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.error('Failed to update category', 'ERROR', 500);
  }
});

// DELETE /admin/categories/:id - Delete category
router.delete('/categories/:id', (req, res) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
    if (!existing) {
      return res.error('Category not found', 'NOT_FOUND', 404);
    }

    // Check if category has works
    const worksCount = db.prepare('SELECT COUNT(*) as count FROM works WHERE category_id = ?').get(id).count;
    if (worksCount > 0) {
      return res.error('Cannot delete category with works', 'HAS_CHILDREN', 400);
    }

    // Check if category has subcategories
    const subCount = db.prepare('SELECT COUNT(*) as count FROM categories WHERE parent_id = ?').get(id).count;
    if (subCount > 0) {
      return res.error('Cannot delete category with subcategories', 'HAS_CHILDREN', 400);
    }

    db.prepare('DELETE FROM categories WHERE id = ?').run(id);

    res.success({ message: 'Category deleted' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.error('Failed to delete category', 'ERROR', 500);
  }
});

// === TAGS ===

// POST /admin/tags - Create tag
router.post('/tags', (req, res) => {
  try {
    const { name, color = '#6B7280' } = req.body;

    if (!name || !name.trim()) {
      return res.error('Tag name is required', 'VALIDATION_ERROR', 400);
    }

    // Check if tag already exists
    const existing = db.prepare('SELECT id FROM tags WHERE name = ?').get(name);
    if (existing) {
      return res.error('Tag already exists', 'ALREADY_EXISTS', 400);
    }

    const insertStmt = db.prepare('INSERT INTO tags (name, color) VALUES (?, ?)');
    const result = insertStmt.run(name, color);
    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(result.lastInsertRowid);

    res.success(tag);
  } catch (error) {
    console.error('Error creating tag:', error);
    res.error('Failed to create tag', 'ERROR', 500);
  }
});

// PUT /admin/tags/:id - Update tag
router.put('/tags/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    const existing = db.prepare('SELECT id FROM tags WHERE id = ?').get(id);
    if (!existing) {
      return res.error('Tag not found', 'NOT_FOUND', 404);
    }

    // Check if new name already exists (for a different tag)
    if (name) {
      const duplicate = db.prepare('SELECT id FROM tags WHERE name = ? AND id != ?').get(name, id);
      if (duplicate) {
        return res.error('Tag name already exists', 'ALREADY_EXISTS', 400);
      }
    }

    const updateStmt = db.prepare(`
      UPDATE tags SET
        name = COALESCE(?, name),
        color = COALESCE(?, color)
      WHERE id = ?
    `);

    updateStmt.run(name, color, id);
    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(id);

    res.success(tag);
  } catch (error) {
    console.error('Error updating tag:', error);
    res.error('Failed to update tag', 'ERROR', 500);
  }
});

// DELETE /admin/tags/:id - Delete tag
router.delete('/tags/:id', (req, res) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT id FROM tags WHERE id = ?').get(id);
    if (!existing) {
      return res.error('Tag not found', 'NOT_FOUND', 404);
    }

    // Remove tag from works
    db.prepare('DELETE FROM work_tags WHERE tag_id = ?').run(id);
    // Delete tag
    db.prepare('DELETE FROM tags WHERE id = ?').run(id);

    res.success({ message: 'Tag deleted' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.error('Failed to delete tag', 'ERROR', 500);
  }
});

// === USERS ===

// GET /admin/users - List users
router.get('/users', (req, res) => {
  try {
    const { page = 1, per_page = 20, q } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(per_page);

    let whereClause = '1=1';
    const params = [];

    if (q) {
      whereClause += ' AND (name LIKE ? OR email LIKE ?)';
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm);
    }

    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM users WHERE ${whereClause}`);
    const { count } = countStmt.get(...params);

    const stmt = db.prepare(`
      SELECT id, email, name, avatar_url, role, is_active, last_login, created_at
      FROM users
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    const users = stmt.all(...params, parseInt(per_page), offset);

    res.success(users, {
      page: parseInt(page),
      per_page: parseInt(per_page),
      total: count,
      total_pages: Math.ceil(count / parseInt(per_page))
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.error('Failed to fetch users', 'ERROR', 500);
  }
});

// PUT /admin/users/:id/role - Change user role
router.put('/users/:id/role', (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
      return res.error('Invalid role', 'VALIDATION_ERROR', 400);
    }

    const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!existing) {
      return res.error('User not found', 'NOT_FOUND', 404);
    }

    // Prevent removing own admin role
    if (req.user.id === parseInt(id) && role !== 'admin') {
      return res.error('Cannot remove your own admin role', 'FORBIDDEN', 403);
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
    const user = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(id);

    res.success(user);
  } catch (error) {
    console.error('Error changing role:', error);
    res.error('Failed to change role', 'ERROR', 500);
  }
});

// PUT /admin/users/:id/status - Toggle user active status
router.put('/users/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const existing = db.prepare('SELECT id, is_active FROM users WHERE id = ?').get(id);
    if (!existing) {
      return res.error('User not found', 'NOT_FOUND', 404);
    }

    // Prevent disabling own account
    if (req.user.id === parseInt(id) && !is_active) {
      return res.error('Cannot disable your own account', 'FORBIDDEN', 403);
    }

    const newStatus = is_active !== undefined ? (is_active ? 1 : 0) : (existing.is_active ? 0 : 1);
    db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(newStatus, id);

    res.success({ message: newStatus ? 'User enabled' : 'User disabled', is_active: newStatus });
  } catch (error) {
    console.error('Error toggling status:', error);
    res.error('Failed to toggle status', 'ERROR', 500);
  }
});

// DELETE /admin/users/:id - Delete user
router.delete('/users/:id', (req, res) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT id, email, role FROM users WHERE id = ?').get(id);
    if (!existing) {
      return res.error('User not found', 'NOT_FOUND', 404);
    }

    // Prevent deleting own account
    if (req.user.id === parseInt(id)) {
      return res.error('Cannot delete your own account', 'FORBIDDEN', 403);
    }

    // Delete user's related data first
    db.prepare('DELETE FROM votes WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM comments WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM favorites WHERE user_id = ?').run(id);
    db.prepare('UPDATE activity_logs SET user_id = NULL WHERE user_id = ?').run(id);

    // Delete user
    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    res.success({ message: 'User deleted successfully', email: existing.email });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.error('Failed to delete user', 'ERROR', 500);
  }
});

// === EXPORT ===

// GET /admin/export/:type - Export data
router.get('/export/:type', (req, res) => {
  try {
    const { type } = req.params;
    const { category_id, q: searchQuery } = req.query;

    if (type === 'csv') {
      // Build dynamic query with filters
      let sql = `
        SELECT w.*, c.name as category_name, wt.name as work_type_name
        FROM works w
        LEFT JOIN categories c ON w.category_id = c.id
        LEFT JOIN work_types wt ON w.work_type_id = wt.id
        WHERE 1=1
      `;
      const params = [];

      if (category_id) {
        sql += ' AND w.category_id = ?';
        params.push(category_id);
      }

      if (searchQuery) {
        sql += ' AND (w.title LIKE ? OR w.author_name LIKE ?)';
        params.push(`%${searchQuery}%`, `%${searchQuery}%`);
      }

      sql += ' ORDER BY w.created_at DESC';

      const works = db.prepare(sql).all(...params);

      // Generate CSV
      const headers = ['ID', 'Title', 'Author', 'Category', 'Type', 'Views', 'Downloads', 'Created'];
      const rows = works.map(w => [
        w.id,
        `"${(w.title || '').replace(/"/g, '""')}"`,
        `"${(w.author_name || '').replace(/"/g, '""')}"`,
        w.category_name || '',
        w.work_type_name || '',
        w.view_count,
        w.download_count,
        w.created_at
      ]);

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=works-export.csv');
      res.send(csv);
    } else if (type === 'votes') {
      // Export votes summary
      const votes = db.prepare(`
        SELECT
          v.id,
          w.title as work_title,
          u.name as user_name,
          u.email as user_email,
          v.stars,
          v.created_at
        FROM votes v
        JOIN works w ON v.work_id = w.id
        JOIN users u ON v.user_id = u.id
        ORDER BY v.created_at DESC
      `).all();

      const headers = ['ID', 'Work Title', 'User', 'Email', 'Stars', 'Date'];
      const rows = votes.map(v => [
        v.id,
        `"${(v.work_title || '').replace(/"/g, '""')}"`,
        `"${(v.user_name || '').replace(/"/g, '""')}"`,
        v.user_email || '',
        v.stars,
        v.created_at
      ]);

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=votes-export.csv');
      res.send(csv);
    } else if (type === 'activity') {
      // Export activity logs
      const activities = db.prepare(`
        SELECT
          a.id,
          w.title as work_title,
          u.name as user_name,
          u.email as user_email,
          a.action,
          a.ip_address,
          a.created_at
        FROM activity_logs a
        LEFT JOIN works w ON a.work_id = w.id
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC
        LIMIT 1000
      `).all();

      const headers = ['ID', 'Work Title', 'User', 'Email', 'Action', 'IP Address', 'Date'];
      const rows = activities.map(a => [
        a.id,
        `"${(a.work_title || '').replace(/"/g, '""')}"`,
        `"${(a.user_name || 'Anonymous').replace(/"/g, '""')}"`,
        a.user_email || '',
        a.action,
        a.ip_address || '',
        a.created_at
      ]);

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=activity-export.csv');
      res.send(csv);
    } else if (type === 'pdf') {
      // Generate PDF Analytics Report using pdfkit
      const doc = new PDFDocument({ margin: 50 });

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics-report.pdf');

      // Pipe the PDF to the response
      doc.pipe(res);

      // Get analytics data
      const totalWorks = db.prepare('SELECT COUNT(*) as count FROM works').get().count;
      const totalViews = db.prepare('SELECT COALESCE(SUM(view_count), 0) as count FROM works').get().count;
      const totalDownloads = db.prepare('SELECT COALESCE(SUM(download_count), 0) as count FROM works').get().count;
      const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
      const totalVotes = db.prepare('SELECT COUNT(*) as count FROM votes').get().count;
      const totalComments = db.prepare('SELECT COUNT(*) as count FROM comments WHERE is_deleted = 0').get().count;

      // Get top viewed works
      const topViewed = db.prepare(`
        SELECT title, author_name, view_count
        FROM works
        ORDER BY view_count DESC
        LIMIT 10
      `).all();

      // Get top rated works
      const topRated = db.prepare(`
        SELECT w.title, w.author_name, AVG(v.stars) as avg_rating, COUNT(v.id) as vote_count
        FROM works w
        INNER JOIN votes v ON w.id = v.work_id
        GROUP BY w.id
        HAVING vote_count > 0
        ORDER BY avg_rating DESC, vote_count DESC
        LIMIT 10
      `).all();

      // Get category distribution
      const categoryDist = db.prepare(`
        SELECT c.name, COUNT(w.id) as count
        FROM categories c
        LEFT JOIN works w ON c.id = w.category_id
        GROUP BY c.id
        ORDER BY count DESC
      `).all();

      // Title
      doc.fontSize(24).font('Helvetica-Bold').text('Analytics Report', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(2);

      // Summary Statistics
      doc.fontSize(16).font('Helvetica-Bold').text('Summary Statistics');
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica');
      doc.text(`Total Works: ${totalWorks}`);
      doc.text(`Total Views: ${totalViews}`);
      doc.text(`Total Downloads: ${totalDownloads}`);
      doc.text(`Total Users: ${totalUsers}`);
      doc.text(`Total Votes: ${totalVotes}`);
      doc.text(`Total Comments: ${totalComments}`);
      doc.moveDown(1.5);

      // Top 10 Most Viewed Works
      doc.fontSize(16).font('Helvetica-Bold').text('Top 10 Most Viewed Works');
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      if (topViewed.length > 0) {
        topViewed.forEach((work, index) => {
          doc.text(`${index + 1}. ${work.title} by ${work.author_name || 'Unknown'} - ${work.view_count} views`);
        });
      } else {
        doc.text('No data available');
      }
      doc.moveDown(1.5);

      // Top 10 Highest Rated Works
      doc.fontSize(16).font('Helvetica-Bold').text('Top 10 Highest Rated Works');
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      if (topRated.length > 0) {
        topRated.forEach((work, index) => {
          doc.text(`${index + 1}. ${work.title} by ${work.author_name || 'Unknown'} - ${work.avg_rating.toFixed(1)} stars (${work.vote_count} votes)`);
        });
      } else {
        doc.text('No data available');
      }
      doc.moveDown(1.5);

      // Category Distribution
      doc.fontSize(16).font('Helvetica-Bold').text('Category Distribution');
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      if (categoryDist.length > 0) {
        categoryDist.forEach(cat => {
          doc.text(`${cat.name}: ${cat.count} works`);
        });
      } else {
        doc.text('No categories available');
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(10).font('Helvetica').fillColor('gray')
        .text('Student Work Archive System - Analytics Report', { align: 'center' });

      // Finalize PDF
      doc.end();
    } else {
      res.error('Invalid export type', 'VALIDATION_ERROR', 400);
    }
  } catch (error) {
    console.error('Error exporting:', error);
    res.error('Export failed', 'ERROR', 500);
  }
});

// === BULK IMPORT ===

// POST /admin/works/import - Bulk import works from Drive folder
router.post('/works/import', (req, res) => {
  try {
    const { folder_id, files } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.error('No files selected for import', 'VALIDATION_ERROR', 400);
    }

    const results = {
      success: [],
      failed: []
    };

    const insertStmt = db.prepare(`
      INSERT INTO works (
        title, description, author_name, author_email, academic_year,
        work_type_id, category_id, google_file_id, file_url, thumbnail_url,
        file_size, page_count, is_featured, is_public, share_token,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    for (const file of files) {
      try {
        // Generate share token
        const share_token = crypto.randomBytes(16).toString('hex');

        // Extract metadata from filename (e.g., "Author Name - Title.pdf")
        let title = file.name || 'Untitled';
        let author_name = '';

        // Try to parse "Author - Title" format
        const match = title.match(/^(.+?)\s*[-–]\s*(.+)$/);
        if (match) {
          author_name = match[1].trim();
          title = match[2].trim();
        }

        // Remove file extension from title
        title = title.replace(/\.(pdf|doc|docx|ppt|pptx)$/i, '');

        const result = insertStmt.run(
          title,
          file.description || `Imported from Google Drive folder: ${folder_id}`,
          author_name || file.author_name || null,
          file.author_email || null,
          file.academic_year || new Date().getFullYear().toString(),
          file.work_type_id || null,
          file.category_id || null,
          file.id, // Google file ID
          file.webViewLink || null,
          file.thumbnailLink || null,
          file.size || null,
          file.page_count || null,
          0, // is_featured
          1, // is_public
          share_token
        );

        results.success.push({
          id: result.lastInsertRowid,
          name: file.name,
          title
        });
      } catch (err) {
        console.error('Error importing file:', file.name, err);
        results.failed.push({
          name: file.name,
          error: err.message
        });
      }
    }

    res.success({
      message: `Imported ${results.success.length} of ${files.length} files`,
      imported: results.success.length,
      failed: results.failed.length,
      results
    });
  } catch (error) {
    console.error('Error in bulk import:', error);
    res.error('Failed to import works', 'ERROR', 500);
  }
});

// GET /admin/drive/files - List files from Drive folder (simulated for development)
router.get('/drive/files', (req, res) => {
  try {
    const { folder_id } = req.query;

    if (!folder_id) {
      return res.error('Folder ID is required', 'VALIDATION_ERROR', 400);
    }

    // In development mode, return simulated Drive files
    // In production, this would use Google Drive API
    const simulatedFiles = [
      {
        id: `file_${folder_id}_1`,
        name: 'John Doe - Machine Learning Project Report.pdf',
        mimeType: 'application/pdf',
        size: 2457600,
        createdTime: new Date().toISOString(),
        webViewLink: `https://drive.google.com/file/d/file_${folder_id}_1/view`,
        thumbnailLink: null
      },
      {
        id: `file_${folder_id}_2`,
        name: 'Jane Smith - Web Application Development.pdf',
        mimeType: 'application/pdf',
        size: 1843200,
        createdTime: new Date().toISOString(),
        webViewLink: `https://drive.google.com/file/d/file_${folder_id}_2/view`,
        thumbnailLink: null
      },
      {
        id: `file_${folder_id}_3`,
        name: 'Student Work - IoT Smart Home System.pdf',
        mimeType: 'application/pdf',
        size: 3145728,
        createdTime: new Date().toISOString(),
        webViewLink: `https://drive.google.com/file/d/file_${folder_id}_3/view`,
        thumbnailLink: null
      },
      {
        id: `file_${folder_id}_4`,
        name: 'Research Team - Data Analysis Final Report.pdf',
        mimeType: 'application/pdf',
        size: 4194304,
        createdTime: new Date().toISOString(),
        webViewLink: `https://drive.google.com/file/d/file_${folder_id}_4/view`,
        thumbnailLink: null
      },
      {
        id: `file_${folder_id}_5`,
        name: 'Alice Brown - Mobile App Design Presentation.pdf',
        mimeType: 'application/pdf',
        size: 5242880,
        createdTime: new Date().toISOString(),
        webViewLink: `https://drive.google.com/file/d/file_${folder_id}_5/view`,
        thumbnailLink: null
      }
    ];

    res.success({
      folderId: folder_id,
      files: simulatedFiles,
      isSimulated: true,
      message: 'Development mode: Using simulated files. Connect Google Drive API for real files.'
    });
  } catch (error) {
    console.error('Error listing drive files:', error);
    res.error('Failed to list drive files', 'ERROR', 500);
  }
});

// === WORK TYPES ===

// GET /admin/work-types - Get all work types
router.get('/work-types', (req, res) => {
  try {
    const workTypes = db.prepare('SELECT * FROM work_types ORDER BY name').all();
    res.success(workTypes);
  } catch (error) {
    console.error('Error fetching work types:', error);
    res.error('Failed to fetch work types', 'ERROR', 500);
  }
});

// POST /admin/work-types - Create a new work type
router.post('/work-types', (req, res) => {
  try {
    const { name, icon = 'file' } = req.body;

    if (!name || !name.trim()) {
      return res.error('Work type name is required', 'VALIDATION_ERROR', 400);
    }

    // Check for duplicate
    const existing = db.prepare('SELECT id FROM work_types WHERE name = ?').get(name.trim());
    if (existing) {
      return res.error('Work type already exists', 'ALREADY_EXISTS', 409);
    }

    const result = db.prepare('INSERT INTO work_types (name, icon) VALUES (?, ?)').run(name.trim(), icon);
    const workType = db.prepare('SELECT * FROM work_types WHERE id = ?').get(result.lastInsertRowid);

    res.success(workType, { message: 'Work type created successfully' });
  } catch (error) {
    console.error('Error creating work type:', error);
    res.error('Failed to create work type', 'ERROR', 500);
  }
});

// PUT /admin/work-types/:id - Update a work type
router.put('/work-types/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon } = req.body;

    if (!name || !name.trim()) {
      return res.error('Work type name is required', 'VALIDATION_ERROR', 400);
    }

    // Check if work type exists
    const existing = db.prepare('SELECT * FROM work_types WHERE id = ?').get(id);
    if (!existing) {
      return res.error('Work type not found', 'NOT_FOUND', 404);
    }

    // Check for duplicate name (excluding current)
    const duplicate = db.prepare('SELECT id FROM work_types WHERE name = ? AND id != ?').get(name.trim(), id);
    if (duplicate) {
      return res.error('Work type name already exists', 'ALREADY_EXISTS', 409);
    }

    db.prepare('UPDATE work_types SET name = ?, icon = ? WHERE id = ?').run(name.trim(), icon || existing.icon, id);
    const workType = db.prepare('SELECT * FROM work_types WHERE id = ?').get(id);

    res.success(workType, { message: 'Work type updated successfully' });
  } catch (error) {
    console.error('Error updating work type:', error);
    res.error('Failed to update work type', 'ERROR', 500);
  }
});

// DELETE /admin/work-types/:id - Delete a work type
router.delete('/work-types/:id', (req, res) => {
  try {
    const { id } = req.params;

    // Check if work type exists
    const existing = db.prepare('SELECT * FROM work_types WHERE id = ?').get(id);
    if (!existing) {
      return res.error('Work type not found', 'NOT_FOUND', 404);
    }

    // Check if work type is in use
    const inUse = db.prepare('SELECT COUNT(*) as count FROM works WHERE work_type_id = ?').get(id);
    if (inUse.count > 0) {
      return res.error(`Cannot delete work type: ${inUse.count} works are using it`, 'IN_USE', 409);
    }

    db.prepare('DELETE FROM work_types WHERE id = ?').run(id);
    res.success({ id: parseInt(id) }, { message: 'Work type deleted successfully' });
  } catch (error) {
    console.error('Error deleting work type:', error);
    res.error('Failed to delete work type', 'ERROR', 500);
  }
});

export default router;
