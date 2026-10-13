const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Endpoint de verificare
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Vocab API is running successfully' });
});

// Endpoint pentru adăugarea unei casete noi de vocabular
app.post('/api/vocabulary', (req, res) => {
    const { word, translation, grammar_properties, examples, difficulty } = req.body;

    if (!word || !translation || !difficulty) {
        return res.status(400).json({ error: 'Word, translation, and difficulty are required fields.' });
    }

    const sql = `INSERT INTO vocabulary (word, translation, grammar_properties, examples, difficulty) VALUES (?, ?, ?, ?, ?)`;
    const params = [word, translation, grammar_properties, JSON.stringify(examples), difficulty];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({
            message: 'Vocabulary item created successfully',
            id: this.lastID
        });
    });
});

// Endpoint pentru listarea tuturor casetelor de vocabular
app.get('/api/vocabulary', (req, res) => {
    const sql = `SELECT * FROM vocabulary ORDER BY id DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({
            message: 'success',
            data: rows
        });
    });
});

// Endpoint pentru ștergerea unei casete de vocabular după ID
app.delete('/api/vocabulary/:id', (req, res) => {
    const id = req.params.id;
    const sql = `DELETE FROM vocabulary WHERE id = ?`;
    
    db.run(sql, id, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({
            message: 'deleted successfully',
            changes: this.changes
        });
    });
});

// Endpoint pentru generarea unui quiz (opțional filtrat după dificultate)
app.get('/api/quiz', (req, res) => {
    const { difficulty } = req.query;
    let sql = `SELECT * FROM vocabulary`;
    let params = [];

    if (difficulty && difficulty !== 'All') {
        sql += ` WHERE difficulty = ?`;
        params.push(difficulty);
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        // Amestecăm cuvintele aleatoriu (Fisher-Yates shuffle)
        for (let i = rows.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rows[i], rows[j]] = [rows[j], rows[i]];
        }

        res.json({
            message: 'success',
            data: rows
        });
    });
});

// Endpoint pentru exportul complet al datelor (util pentru backup în Google Drive)
app.get('/api/export', (req, res) => {
    const sql = `SELECT * FROM vocabulary`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        const backupData = {
            exportDate: new Date().toISOString(),
            totalItems: rows.length,
            vocabulary: rows.map(item => ({
                ...item,
                examples: item.examples ? JSON.parse(item.examples) : []
            }))
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=vocab-backup.json');
        res.status(200).send(JSON.stringify(backupData, null, 2));
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});