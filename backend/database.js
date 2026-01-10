const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'data', 'albums.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Albums Table
        db.run(`CREATE TABLE IF NOT EXISTS albums (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            artist TEXT NOT NULL,
            cover TEXT,
            status TEXT DEFAULT 'Pendiente',
            rating REAL DEFAULT 0,
            review TEXT,
            favorites TEXT,
            date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
            listened_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);

        // Listening History Table
        db.run(`CREATE TABLE IF NOT EXISTS listening_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            album_id INTEGER NOT NULL,
            listened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (album_id) REFERENCES albums (id)
        )`);

        // Migration: Add listened_at if not exists (lazy way) check - kept for backward compat for now but ideally moved to history
        db.run(`ALTER TABLE albums ADD COLUMN listened_at DATETIME`, (err) => {
            // Silence error if column exists
        });

        // Migration to populate history from old listened_at if empty
        db.get("SELECT count(*) as count FROM listening_history", (err, row) => {
            if (!err && row.count === 0) {
                db.run(`INSERT INTO listening_history (user_id, album_id, listened_at) 
                         SELECT user_id, id, listened_at FROM albums WHERE listened_at IS NOT NULL`);
            }
        });

        // Milestones Events (to track if we showed the animation)
        db.run(`CREATE TABLE IF NOT EXISTS milestones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            level INTEGER NOT NULL,
            reached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);

        // Blog Table
        db.run(`CREATE TABLE IF NOT EXISTS blog (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);
    });
}

module.exports = db;
