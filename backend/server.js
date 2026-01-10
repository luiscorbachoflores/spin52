const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: '../.env' });

const db = require('./database.js');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'secret-key-change-me';
const LASTFM_API_KEY = process.env.LAST_FM_API_KEY || process.env.LASTFM_API_KEY;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

app.use(cors());
app.use(express.json());

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided' });

    jwt.verify(token.split(' ')[1], SECRET_KEY, (err, decoded) => {
        if (err) return res.status(500).json({ error: 'Failed to authenticate token' });
        req.userId = decoded.id;
        next();
    });
};

const verifyAdmin = (req, res, next) => {
    const token = req.headers['x-admin-token'];
    if (!token || token !== ADMIN_TOKEN) return res.status(403).json({ error: 'Unauthorized Admin Access' });
    next();
};

// --- Auth Routes ---
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    const hashedPassword = bcrypt.hashSync(password, 8);

    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) return res.status(400).json({ error: 'User already exists' });
            return res.status(500).json({ error: err.message });
        }
        const token = jwt.sign({ id: this.lastID }, SECRET_KEY, { expiresIn: 86400 });
        res.status(200).json({ auth: true, token, user: { id: this.lastID, username } });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) return res.status(401).json({ auth: false, token: null });

        const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: 86400 });
        res.status(200).json({ auth: true, token, user: { id: user.id, username: user.username } });
    });
});

// --- Admin Routes ---
app.get('/api/admin/users', verifyAdmin, (req, res) => {
    db.all(`SELECT id, username, created_at FROM users`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(rows);
    });
});

app.delete('/api/admin/users/:id', verifyAdmin, (req, res) => {
    db.serialize(() => {
        db.run(`DELETE FROM albums WHERE user_id = ?`, [req.params.id]);
        db.run(`DELETE FROM milestones WHERE user_id = ?`, [req.params.id]);
        db.run(`DELETE FROM users WHERE id = ?`, [req.params.id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(200).json({ message: 'User deleted' });
        });
    });
});

// --- Album Routes ---
app.get('/api/albums', verifyToken, (req, res) => {
    db.all(`SELECT * FROM albums WHERE user_id = ? ORDER BY date_added DESC`, [req.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(rows);
    });
});

app.get('/api/albums/:id', verifyToken, (req, res) => {
    db.get(`SELECT * FROM albums WHERE id = ? AND user_id = ?`, [req.params.id, req.userId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Album not found' });
        res.status(200).json(row);
    });
});

app.get('/api/community-albums', verifyToken, (req, res) => {
    // Join with users table to get usernames
    const sql = `
        SELECT albums.*, users.username 
        FROM albums 
        JOIN users ON albums.user_id = users.id 
        ORDER BY albums.listened_at DESC, albums.date_added DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(rows);
    });
});

app.post('/api/albums', verifyToken, (req, res) => {
    const { title, artist, cover, status, rating, review, favorites, dateAdded, listenedAt } = req.body;
    const sql = `INSERT INTO albums (user_id, title, artist, cover, status, rating, review, favorites, date_added, listened_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
        req.userId, title, artist, cover, status, rating, review, favorites,
        dateAdded || new Date(),
        listenedAt || (status === 'Escuchado' ? new Date() : null)
    ];

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ id: this.lastID, ...req.body });
    });
});

app.put('/api/albums/:id', verifyToken, (req, res) => {
    const { status, rating, review, favorites, listenedAt, title, artist, cover } = req.body;

    // Build dynamic query
    let updates = [];
    let params = [];

    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (rating !== undefined) { updates.push('rating = ?'); params.push(rating); }
    if (review !== undefined) { updates.push('review = ?'); params.push(review); }
    if (favorites !== undefined) { updates.push('favorites = ?'); params.push(favorites); }
    if (listenedAt !== undefined) { updates.push('listened_at = ?'); params.push(listenedAt); }

    // Allow updating metadata if needed
    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (artist !== undefined) { updates.push('artist = ?'); params.push(artist); }
    if (cover !== undefined) { updates.push('cover = ?'); params.push(cover); }

    if (updates.length === 0) return res.json({ message: 'No changes' });

    params.push(req.params.id);
    params.push(req.userId);

    const sql = `UPDATE albums SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Updated' });
    });
});

app.delete('/api/albums/:id', verifyToken, (req, res) => {
    db.run(`DELETE FROM albums WHERE id = ? AND user_id = ?`, [req.params.id, req.userId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Deleted' });
    });
});

// --- Search / Info Proxy (Last.fm) ---
app.get('/api/search', verifyToken, async (req, res) => {
    const { q } = req.query;
    if (!LASTFM_API_KEY) return res.json({ results: [] });

    try {
        const response = await axios.get(`http://ws.audioscrobbler.com/2.0/?method=album.search&album=${encodeURIComponent(q)}&api_key=${LASTFM_API_KEY}&format=json`);
        const albums = response.data.results.albummatches.album.map(a => ({
            title: a.name,
            artist: a.artist,
            cover: a.image[2]['#text'] || ''
        }));
        res.json(albums);
    } catch (error) {
        console.error("Last.fm error", error.message);
        res.status(500).json({ error: 'External API Error' });
    }
});

app.get('/api/album-info', verifyToken, async (req, res) => {
    const { artist, album } = req.query;
    if (!LASTFM_API_KEY) return res.json({ tracks: [] });

    try {
        const url = `http://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=${LASTFM_API_KEY}&artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(album)}&format=json`;
        const response = await axios.get(url);

        if (!response.data.album) return res.json({ tracks: [] });

        const tracks = Array.isArray(response.data.album.tracks.track)
            ? response.data.album.tracks.track.map(t => t.name)
            : [response.data.album.tracks.track.name];

        res.json({
            tracks,
            summary: response.data.album.wiki ? response.data.album.wiki.summary : '',
            published: response.data.album.wiki ? response.data.album.wiki.published : ''
        });
    } catch (error) {
        console.error("Last.fm error", error.message);
        res.json({ tracks: [] }); // Fail gracefully
    }
});

// Serve static
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
