import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { isAuthenticated, isAdmin } from './auth.js';
import crypto from 'crypto';

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

    res.success({
      totalWorks,
      totalViews,
      totalDownloads,
      totalUsers,
      topWorks,
      topRated
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

    if (!title) {
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

// POST /admin/categories - Create category
router.post('/categories', (req, res) => {
  try {
    const { name, description, parent_id, sort_order = 0 } = req.body;

    if (!name) {
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

    if (!name) {
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

// === EXPORT ===

// GET /admin/export/:type - Export data
router.get('/export/:type', (req, res) => {
  try {
    const { type } = req.params;

    if (type === 'csv') {
      const works = db.prepare(`
        SELECT w.*, c.name as category_name, wt.name as work_type_name
        FROM works w
        LEFT JOIN categories c ON w.category_id = c.id
        LEFT JOIN work_types wt ON w.work_type_id = wt.id
        ORDER BY w.created_at DESC
      `).all();

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
    } else if (type === 'pdf') {
      // For PDF, we'll just return a text-based report for now
      // Full PDF generation would require a library like pdfkit
      res.error('PDF export not yet implemented', 'NOT_IMPLEMENTED', 501);
    } else {
      res.error('Invalid export type', 'VALIDATION_ERROR', 400);
    }
  } catch (error) {
    console.error('Error exporting:', error);
    res.error('Export failed', 'ERROR', 500);
  }
});

export default router;
