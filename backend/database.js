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

        // Migration: Add listened_at if not exists (lazy way)
        db.run(`ALTER TABLE albums ADD COLUMN listened_at DATETIME`, (err) => {
            // Silence error if column exists
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
