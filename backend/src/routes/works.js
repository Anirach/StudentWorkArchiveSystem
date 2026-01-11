import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { isAuthenticated } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Database connection
const dbPath = path.join(__dirname, '../../data/archive.db');
const db = new Database(dbPath);

// GET /api/works - List works with filtering and pagination
router.get('/', (req, res) => {
  try {
    const {
      page = 1,
      per_page = 12,
      category_id,
      work_type_id,
      tag_id,
      academic_year,
      sort = 'created_at',
      order = 'desc',
      q
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(per_page);
    let whereClause = 'WHERE w.is_public = 1';
    const params = [];

    if (category_id) {
      whereClause += ' AND w.category_id = ?';
      params.push(category_id);
    }

    if (work_type_id) {
      whereClause += ' AND w.work_type_id = ?';
      params.push(work_type_id);
    }

    if (academic_year) {
      whereClause += ' AND w.academic_year = ?';
      params.push(academic_year);
    }

    if (q) {
      whereClause += ' AND (w.title LIKE ? OR w.description LIKE ? OR w.author_name LIKE ?)';
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Handle tag filtering through a subquery
    let fromClause = 'FROM works w';
    if (tag_id) {
      fromClause = 'FROM works w INNER JOIN work_tags wt_filter ON w.id = wt_filter.work_id';
      whereClause += ' AND wt_filter.tag_id = ?';
      params.push(tag_id);
    }

    // Get total count
    const countStmt = db.prepare(`SELECT COUNT(DISTINCT w.id) as count ${fromClause} ${whereClause}`);
    const { count } = countStmt.get(...params);

    // Get works - map frontend sort values to database columns
    const sortMap = {
      'date': 'w.created_at',
      'created_at': 'w.created_at',
      'views': 'w.view_count',
      'view_count': 'w.view_count',
      'downloads': 'w.download_count',
      'download_count': 'w.download_count',
      'rating': 'avg_rating',
      'title': 'w.title'
    };
    const sortColumn = sortMap[sort] || 'w.created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

    const stmt = db.prepare(`
      SELECT DISTINCT w.*,
             c.name as category_name,
             wtype.name as work_type_name,
             (SELECT AVG(stars) FROM votes WHERE work_id = w.id) as avg_rating,
             (SELECT COUNT(*) FROM votes WHERE work_id = w.id) as vote_count
      ${fromClause}
      LEFT JOIN categories c ON w.category_id = c.id
      LEFT JOIN work_types wtype ON w.work_type_id = wtype.id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `);

    const works = stmt.all(...params, parseInt(per_page), offset);

    // Get tags for each work
    const tagStmt = db.prepare(`
      SELECT t.* FROM tags t
      JOIN work_tags wt ON t.id = wt.tag_id
      WHERE wt.work_id = ?
    `);

    const worksWithTags = works.map(work => ({
      ...work,
      tags: tagStmt.all(work.id)
    }));

    res.success(worksWithTags, {
      page: parseInt(page),
      per_page: parseInt(per_page),
      total: count,
      total_pages: Math.ceil(count / parseInt(per_page))
    });
  } catch (error) {
    console.error('Error fetching works:', error);
    res.error('Failed to fetch works', 'FETCH_ERROR', 500);
  }
});

// GET /api/works/featured - Get featured works
router.get('/featured', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT w.*,
             c.name as category_name,
             wt.name as work_type_name,
             (SELECT AVG(stars) FROM votes WHERE work_id = w.id) as avg_rating,
             (SELECT COUNT(*) FROM votes WHERE work_id = w.id) as vote_count
      FROM works w
      LEFT JOIN categories c ON w.category_id = c.id
      LEFT JOIN work_types wt ON w.work_type_id = wt.id
      WHERE w.is_featured = 1 AND w.is_public = 1
      ORDER BY w.created_at DESC
      LIMIT 10
    `);
    const works = stmt.all();
    res.success(works);
  } catch (error) {
    console.error('Error fetching featured works:', error);
    res.error('Failed to fetch featured works', 'FETCH_ERROR', 500);
  }
});

// GET /api/works/favorites - List user's favorites (must be before /:id)
router.get('/favorites', isAuthenticated, (req, res) => {
  try {
    const userId = req.user.id;

    const stmt = db.prepare(`
      SELECT w.*,
             c.name as category_name,
             wt.name as work_type_name,
             (SELECT AVG(stars) FROM votes WHERE work_id = w.id) as avg_rating,
             (SELECT COUNT(*) FROM votes WHERE work_id = w.id) as vote_count,
             f.created_at as favorited_at
      FROM favorites f
      JOIN works w ON f.work_id = w.id
      LEFT JOIN categories c ON w.category_id = c.id
      LEFT JOIN work_types wt ON w.work_type_id = wt.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `);
    const favorites = stmt.all(userId);

    res.success(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.error('Failed to fetch favorites', 'ERROR', 500);
  }
});

// GET /api/works/search - Full-text search
router.get('/search', (req, res) => {
  try {
    const { q, page = 1, per_page = 12 } = req.query;

    if (!q) {
      return res.error('Search query is required', 'VALIDATION_ERROR', 400);
    }

    const offset = (parseInt(page) - 1) * parseInt(per_page);
    const searchTerm = `%${q}%`;

    const countStmt = db.prepare(`
      SELECT COUNT(*) as count FROM works
      WHERE is_public = 1 AND (title LIKE ? OR description LIKE ? OR author_name LIKE ?)
    `);
    const { count } = countStmt.get(searchTerm, searchTerm, searchTerm);

    const stmt = db.prepare(`
      SELECT w.*,
             c.name as category_name,
             wt.name as work_type_name,
             (SELECT AVG(stars) FROM votes WHERE work_id = w.id) as avg_rating,
             (SELECT COUNT(*) FROM votes WHERE work_id = w.id) as vote_count
      FROM works w
      LEFT JOIN categories c ON w.category_id = c.id
      LEFT JOIN work_types wt ON w.work_type_id = wt.id
      WHERE w.is_public = 1 AND (w.title LIKE ? OR w.description LIKE ? OR w.author_name LIKE ?)
      ORDER BY w.created_at DESC
      LIMIT ? OFFSET ?
    `);
    const works = stmt.all(searchTerm, searchTerm, searchTerm, parseInt(per_page), offset);

    res.success(works, {
      page: parseInt(page),
      per_page: parseInt(per_page),
      total: count,
      total_pages: Math.ceil(count / parseInt(per_page)),
      query: q
    });
  } catch (error) {
    console.error('Error searching works:', error);
    res.error('Search failed', 'SEARCH_ERROR', 500);
  }
});

// GET /api/works/:id - Get work details
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const stmt = db.prepare(`
      SELECT w.*,
             c.name as category_name,
             wt.name as work_type_name,
             (SELECT AVG(stars) FROM votes WHERE work_id = w.id) as avg_rating,
             (SELECT COUNT(*) FROM votes WHERE work_id = w.id) as vote_count
      FROM works w
      LEFT JOIN categories c ON w.category_id = c.id
      LEFT JOIN work_types wt ON w.work_type_id = wt.id
      WHERE w.id = ?
    `);
    const work = stmt.get(id);

    if (!work) {
      return res.error('Work not found', 'NOT_FOUND', 404);
    }

    // Get tags
    const tagStmt = db.prepare(`
      SELECT t.* FROM tags t
      JOIN work_tags wt ON t.id = wt.tag_id
      WHERE wt.work_id = ?
    `);
    work.tags = tagStmt.all(id);

    // Get user's vote if authenticated
    if (req.user) {
      const voteStmt = db.prepare('SELECT stars FROM votes WHERE work_id = ? AND user_id = ?');
      const vote = voteStmt.get(id, req.user.id);
      work.user_vote = vote?.stars || null;
    }

    // Check if favorited by user
    if (req.user) {
      const favStmt = db.prepare('SELECT id FROM favorites WHERE work_id = ? AND user_id = ?');
      const fav = favStmt.get(id, req.user.id);
      work.is_favorited = !!fav;
    }

    res.success(work);
  } catch (error) {
    console.error('Error fetching work:', error);
    res.error('Failed to fetch work', 'FETCH_ERROR', 500);
  }
});

// POST /api/works/:id/view - Record view
router.post('/:id/view', (req, res) => {
  try {
    const { id } = req.params;

    const stmt = db.prepare('UPDATE works SET view_count = view_count + 1 WHERE id = ?');
    stmt.run(id);

    // Log activity
    const logStmt = db.prepare(`
      INSERT INTO activity_logs (work_id, user_id, action, ip_address, user_agent, created_at)
      VALUES (?, ?, 'view', ?, ?, datetime('now'))
    `);
    logStmt.run(id, req.user?.id || null, req.ip, req.get('user-agent'));

    res.success({ message: 'View recorded' });
  } catch (error) {
    console.error('Error recording view:', error);
    res.error('Failed to record view', 'ERROR', 500);
  }
});

// GET /api/works/:id/download - Get download URL
router.get('/:id/download', (req, res) => {
  try {
    const { id } = req.params;

    const stmt = db.prepare('SELECT * FROM works WHERE id = ?');
    const work = stmt.get(id);

    if (!work) {
      return res.error('Work not found', 'NOT_FOUND', 404);
    }

    // Increment download count
    const updateStmt = db.prepare('UPDATE works SET download_count = download_count + 1 WHERE id = ?');
    updateStmt.run(id);

    // Log activity
    const logStmt = db.prepare(`
      INSERT INTO activity_logs (work_id, user_id, action, ip_address, user_agent, created_at)
      VALUES (?, ?, 'download', ?, ?, datetime('now'))
    `);
    logStmt.run(id, req.user?.id || null, req.ip, req.get('user-agent'));

    res.success({
      file_url: work.file_url,
      google_file_id: work.google_file_id
    });
  } catch (error) {
    console.error('Error getting download URL:', error);
    res.error('Failed to get download URL', 'ERROR', 500);
  }
});

// GET /api/works/:id/related - Get related works
router.get('/:id/related', (req, res) => {
  try {
    const { id } = req.params;

    const workStmt = db.prepare('SELECT category_id FROM works WHERE id = ?');
    const work = workStmt.get(id);

    if (!work) {
      return res.error('Work not found', 'NOT_FOUND', 404);
    }

    const stmt = db.prepare(`
      SELECT w.*,
             c.name as category_name,
             (SELECT AVG(stars) FROM votes WHERE work_id = w.id) as avg_rating
      FROM works w
      LEFT JOIN categories c ON w.category_id = c.id
      WHERE w.id != ? AND w.category_id = ? AND w.is_public = 1
      ORDER BY w.created_at DESC
      LIMIT 5
    `);
    const related = stmt.all(id, work.category_id);

    res.success(related);
  } catch (error) {
    console.error('Error fetching related works:', error);
    res.error('Failed to fetch related works', 'ERROR', 500);
  }
});

// GET /api/works/share/:token - Access shared work by token
router.get('/share/:token', (req, res) => {
  try {
    const { token } = req.params;

    const stmt = db.prepare(`
      SELECT w.*,
             c.name as category_name,
             wt.name as work_type_name,
             (SELECT AVG(stars) FROM votes WHERE work_id = w.id) as avg_rating,
             (SELECT COUNT(*) FROM votes WHERE work_id = w.id) as vote_count
      FROM works w
      LEFT JOIN categories c ON w.category_id = c.id
      LEFT JOIN work_types wt ON w.work_type_id = wt.id
      WHERE w.share_token = ?
    `);
    const work = stmt.get(token);

    if (!work) {
      return res.error('Shared work not found', 'NOT_FOUND', 404);
    }

    res.success(work);
  } catch (error) {
    console.error('Error fetching shared work:', error);
    res.error('Failed to fetch shared work', 'ERROR', 500);
  }
});

// === PROTECTED ROUTES (require authentication) ===

// POST /api/works/:id/vote - Submit or update vote
router.post('/:id/vote', isAuthenticated, (req, res) => {
  try {
    const { id } = req.params;
    const { stars } = req.body;
    const userId = req.user.id;

    // Validate stars
    if (stars === undefined || stars < 0 || stars > 5) {
      return res.error('Stars must be between 0 and 5', 'VALIDATION_ERROR', 400);
    }

    // Check if work exists
    const workStmt = db.prepare('SELECT id FROM works WHERE id = ?');
    const work = workStmt.get(id);
    if (!work) {
      return res.error('Work not found', 'NOT_FOUND', 404);
    }

    // Check if user already voted
    const existingVote = db.prepare('SELECT id FROM votes WHERE work_id = ? AND user_id = ?').get(id, userId);

    if (existingVote) {
      // Update existing vote
      const updateStmt = db.prepare('UPDATE votes SET stars = ?, created_at = datetime(\'now\') WHERE id = ?');
      updateStmt.run(stars, existingVote.id);
    } else {
      // Insert new vote
      const insertStmt = db.prepare(`
        INSERT INTO votes (work_id, user_id, stars, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `);
      insertStmt.run(id, userId, stars);
    }

    // Get updated average rating
    const avgStmt = db.prepare('SELECT AVG(stars) as avg_rating, COUNT(*) as vote_count FROM votes WHERE work_id = ?');
    const stats = avgStmt.get(id);

    res.success({
      message: existingVote ? 'Vote updated' : 'Vote submitted',
      stars,
      avg_rating: stats.avg_rating,
      vote_count: stats.vote_count
    });
  } catch (error) {
    console.error('Error submitting vote:', error);
    res.error('Failed to submit vote', 'ERROR', 500);
  }
});

// DELETE /api/works/:id/vote - Remove vote
router.delete('/:id/vote', isAuthenticated, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deleteStmt = db.prepare('DELETE FROM votes WHERE work_id = ? AND user_id = ?');
    const result = deleteStmt.run(id, userId);

    if (result.changes === 0) {
      return res.error('Vote not found', 'NOT_FOUND', 404);
    }

    // Get updated average rating
    const avgStmt = db.prepare('SELECT AVG(stars) as avg_rating, COUNT(*) as vote_count FROM votes WHERE work_id = ?');
    const stats = avgStmt.get(id);

    res.success({
      message: 'Vote removed',
      avg_rating: stats.avg_rating,
      vote_count: stats.vote_count
    });
  } catch (error) {
    console.error('Error removing vote:', error);
    res.error('Failed to remove vote', 'ERROR', 500);
  }
});

// GET /api/works/:id/comments - List comments
router.get('/:id/comments', (req, res) => {
  try {
    const { id } = req.params;

    const stmt = db.prepare(`
      SELECT c.*, u.name as user_name, u.avatar_url as user_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.work_id = ? AND c.is_deleted = 0
      ORDER BY c.created_at ASC
    `);
    const comments = stmt.all(id);

    // Build threaded structure
    const commentMap = {};
    const rootComments = [];

    comments.forEach(comment => {
      comment.replies = [];
      commentMap[comment.id] = comment;
    });

    comments.forEach(comment => {
      if (comment.parent_id) {
        if (commentMap[comment.parent_id]) {
          commentMap[comment.parent_id].replies.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    res.success(rootComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.error('Failed to fetch comments', 'ERROR', 500);
  }
});

// POST /api/works/:id/comments - Add comment
router.post('/:id/comments', isAuthenticated, (req, res) => {
  try {
    const { id } = req.params;
    const { content, parent_id } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.error('Comment content is required', 'VALIDATION_ERROR', 400);
    }

    // Check if work exists
    const workStmt = db.prepare('SELECT id FROM works WHERE id = ?');
    const work = workStmt.get(id);
    if (!work) {
      return res.error('Work not found', 'NOT_FOUND', 404);
    }

    // If parent_id provided, check if parent comment exists
    if (parent_id) {
      const parentStmt = db.prepare('SELECT id FROM comments WHERE id = ? AND work_id = ?');
      const parent = parentStmt.get(parent_id, id);
      if (!parent) {
        return res.error('Parent comment not found', 'NOT_FOUND', 404);
      }
    }

    const insertStmt = db.prepare(`
      INSERT INTO comments (work_id, user_id, parent_id, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    const result = insertStmt.run(id, userId, parent_id || null, content.trim());

    // Get the created comment with user info
    const commentStmt = db.prepare(`
      SELECT c.*, u.name as user_name, u.avatar_url as user_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `);
    const comment = commentStmt.get(result.lastInsertRowid);

    res.success(comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.error('Failed to add comment', 'ERROR', 500);
  }
});

// PUT /api/comments/:id - Edit comment
router.put('/comments/:commentId', isAuthenticated, (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.error('Comment content is required', 'VALIDATION_ERROR', 400);
    }

    // Check if comment exists and belongs to user
    const existingStmt = db.prepare('SELECT * FROM comments WHERE id = ?');
    const existing = existingStmt.get(commentId);

    if (!existing) {
      return res.error('Comment not found', 'NOT_FOUND', 404);
    }

    if (existing.user_id !== userId && req.user.role !== 'admin') {
      return res.error('You can only edit your own comments', 'FORBIDDEN', 403);
    }

    const updateStmt = db.prepare(`
      UPDATE comments SET content = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    updateStmt.run(content.trim(), commentId);

    // Get updated comment
    const commentStmt = db.prepare(`
      SELECT c.*, u.name as user_name, u.avatar_url as user_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `);
    const comment = commentStmt.get(commentId);

    res.success(comment);
  } catch (error) {
    console.error('Error editing comment:', error);
    res.error('Failed to edit comment', 'ERROR', 500);
  }
});

// DELETE /api/comments/:id - Delete comment (soft delete)
router.delete('/comments/:commentId', isAuthenticated, (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Check if comment exists
    const existingStmt = db.prepare('SELECT * FROM comments WHERE id = ?');
    const existing = existingStmt.get(commentId);

    if (!existing) {
      return res.error('Comment not found', 'NOT_FOUND', 404);
    }

    if (existing.user_id !== userId && req.user.role !== 'admin') {
      return res.error('You can only delete your own comments', 'FORBIDDEN', 403);
    }

    // Soft delete
    const deleteStmt = db.prepare('UPDATE comments SET is_deleted = 1, updated_at = datetime(\'now\') WHERE id = ?');
    deleteStmt.run(commentId);

    res.success({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.error('Failed to delete comment', 'ERROR', 500);
  }
});

// POST /api/works/:id/favorite - Add to favorites
router.post('/:id/favorite', isAuthenticated, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if work exists
    const workStmt = db.prepare('SELECT id FROM works WHERE id = ?');
    const work = workStmt.get(id);
    if (!work) {
      return res.error('Work not found', 'NOT_FOUND', 404);
    }

    // Check if already favorited
    const existingStmt = db.prepare('SELECT id FROM favorites WHERE work_id = ? AND user_id = ?');
    const existing = existingStmt.get(id, userId);

    if (existing) {
      return res.error('Work already in favorites', 'ALREADY_EXISTS', 400);
    }

    const insertStmt = db.prepare(`
      INSERT INTO favorites (work_id, user_id, created_at)
      VALUES (?, ?, datetime('now'))
    `);
    insertStmt.run(id, userId);

    res.success({ message: 'Added to favorites' });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.error('Failed to add to favorites', 'ERROR', 500);
  }
});

// DELETE /api/works/:id/favorite - Remove from favorites
router.delete('/:id/favorite', isAuthenticated, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deleteStmt = db.prepare('DELETE FROM favorites WHERE work_id = ? AND user_id = ?');
    const result = deleteStmt.run(id, userId);

    if (result.changes === 0) {
      return res.error('Work not in favorites', 'NOT_FOUND', 404);
    }

    res.success({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.error('Failed to remove from favorites', 'ERROR', 500);
  }
});

export default router;
