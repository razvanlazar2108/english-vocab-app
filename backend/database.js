const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'vocab.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath, err.message);
    } else {
        console.log('Connected to the SQLite database.');
        createTable();
    }
});

function createTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS vocabulary (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            word TEXT NOT NULL,
            translation TEXT NOT NULL,
            grammar_properties TEXT,
            description TEXT,
            examples TEXT,
            difficulty TEXT CHECK(difficulty IN ('A1-A2', 'B1', 'B2', 'C1-C2')) NOT NULL
        )
    `;
    db.run(sql, (err) => {
        if (err) {
            console.error('Error creating table', err.message);
        } else {
            console.log('Vocabulary table ready.');
            // Adăugăm coloana description dacă baza de date era deja creată fără ji
            db.run(`ALTER TABLE vocabulary ADD COLUMN description TEXT`, () => {});
        }
    });
}

module.exports = db;