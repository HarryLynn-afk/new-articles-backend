// index.js - Main server file
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Test routes
app.get('/', (req, res) => {
  res.json({ message: 'New Articles API is running!' });
});

app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM articles');
    res.json({ 
      message: 'Database connected!', 
      articleCount: rows[0].count 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// ARTICLES ENDPOINTS
// ========================================

app.get('/articles', async (req, res) => {
  try {
    const { category, search } = req.query;
    
    let query = 'SELECT * FROM articles';
    let params = [];
    
    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }
    
    if (search) {
      if (category) {
        query += ' AND (title LIKE ? OR content LIKE ?)';
      } else {
        query += ' WHERE (title LIKE ? OR content LIKE ?)';
      }
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }
    
    query += ' ORDER BY date DESC';
    
    const [articles] = await db.query(query, params);
    res.json(articles);
    
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// ========================================
// BOOKMARKS ENDPOINTS
// ========================================

app.get('/bookmarks', async (req, res) => {
  try {
    const userId = req.query.user_id || 1;
    
    const query = `
      SELECT * FROM bookmarks 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `;
    
    const [bookmarks] = await db.query(query, [userId]);
    res.json(bookmarks);
    
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

app.post('/bookmarks', async (req, res) => {
  try {
    const { user_id, article_id } = req.body;
    
    if (!article_id) {
      return res.status(400).json({ error: 'article_id is required' });
    }
    
    const userId = user_id || 1;
    
    const [existing] = await db.query(
      'SELECT * FROM bookmarks WHERE user_id = ? AND article_id = ?',
      [userId, article_id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Article already bookmarked' });
    }
    
    const [result] = await db.query(
      'INSERT INTO bookmarks (user_id, article_id, created_at) VALUES (?, ?, NOW())',
      [userId, article_id]
    );
    
    res.status(201).json({ 
      message: 'Bookmark added successfully',
      id: result.insertId
    });
    
  } catch (error) {
    console.error('Error adding bookmark:', error);
    res.status(500).json({ error: 'Failed to add bookmark' });
  }
});

app.delete('/bookmarks/:id', async (req, res) => {
  try {
    const bookmarkId = req.params.id;
    
    const [result] = await db.query(
      'DELETE FROM bookmarks WHERE id = ?',
      [bookmarkId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }
    
    res.json({ message: 'Bookmark removed successfully' });
    
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    res.status(500).json({ error: 'Failed to delete bookmark' });
  }
});

// ========================================
// USERS ENDPOINTS
// ========================================

app.post('/users/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'username, email, and password are required' 
      });
    }
    
    const [existingUser] = await db.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existingUser.length > 0) {
      return res.status(400).json({ 
        error: 'Username or email already exists' 
      });
    }
    
    const [result] = await db.query(
      'INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, NOW())',
      [username, email, password]
    );
    
    res.status(201).json({ 
      message: 'User created successfully',
      userId: result.insertId,
      username: username
    });
    
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.post('/users/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'username and password are required' 
      });
    }
    
    const [users] = await db.query(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid username or password' 
      });
    }
    
    const user = users[0];
    
    res.json({ 
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});