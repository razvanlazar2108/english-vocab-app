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
    const { word, translation, grammar_properties, description, examples, difficulty } = req.body;

    if (!word || !translation || !difficulty || !grammar_properties) {
        return res.status(400).json({ error: 'Word, translation, grammar properties, and difficulty are required fields.' });
    }

    const sql = `INSERT INTO vocabulary (word, translation, grammar_properties, description, examples, difficulty) VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [word, translation, grammar_properties, description || '', JSON.stringify(examples), difficulty];

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

// Endpoint pentru generarea unui quiz (filtrat după dificultate, prima literă și valoare gramaticală)
app.get('/api/quiz', (req, res) => {
    const { difficulty, firstLetter, grammar } = req.query;
    let sql = `SELECT * FROM vocabulary WHERE 1=1`;
    let params = [];

    if (difficulty && difficulty !== 'All') {
        sql += ` AND difficulty = ?`;
        params.push(difficulty);
    }

    if (grammar && grammar !== 'All') {
        sql += ` AND grammar_properties = ?`;
        params.push(grammar);
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        // Dacă s-a cerut filtru după prima literă
        let filteredRows = rows;
        if (firstLetter && firstLetter !== 'All') {
            filteredRows = rows.filter(item => item.word.toLowerCase().startsWith(firstLetter.toLowerCase()));
        }

        // Amestecăm cuvintele aleatoriu (Fisher-Yates shuffle)
        for (let i = filteredRows.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [filteredRows[i], filteredRows[j]] = [filteredRows[j], filteredRows[i]];
        }

        res.json({
            message: 'success',
            data: filteredRows
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

// Endpoint pentru actualizarea unei casete de vocabular existente
app.put('/api/vocabulary/:id', (req, res) => {
    const id = req.params.id;
    const { word, translation, grammar_properties, description, examples, difficulty } = req.body;

    if (!word || !translation || !difficulty || !grammar_properties) {
        return res.status(400).json({ error: 'Word, translation, grammar properties, and difficulty are required fields.' });
    }

    const sql = `UPDATE vocabulary SET word = ?, translation = ?, grammar_properties = ?, description = ?, examples = ?, difficulty = ? WHERE id = ?`;
    const params = [word, translation, grammar_properties, description || '', JSON.stringify(examples), difficulty, id];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({
            message: 'Vocabulary item updated successfully',
            changes: this.changes
        });
    });
});

const { google } = require('googleapis');

// Endpoint pentru salvarea backup-ului direct în Google Drive
app.get('/api/drive-backup', async (req, res) => {
    try {
        // 1. Preluăm datele din baza de date
        db.all(`SELECT * FROM vocabulary`, [], async (err, rows) => {
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

            const fileContent = JSON.stringify(backupData, null, 2);

            // Verificăm dacă sunt setate credențialele de Google Drive în mediu (.env)
            const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
            const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
            const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground';
            const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

            if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
                // Dacă nu sunt setate, trimitem fișierul ca descărcare directă și un mesaj explicativ
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', 'attachment; filename=vocab-backup.json');
                return res.status(200).send(fileContent);
            }

            // Dacă avem credențialele, urcăm direct în Google Drive
            const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
            oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

            const drive = google.drive({ version: 'v3', auth: oAuth2Client });

            const fileMetadata = {
                name: `vocab-backup-${new Date().toISOString().slice(0, 10)}.json`,
                mimeType: 'application/json'
            };

            const media = {
                mimeType: 'application/json',
                body: fileContent
            };

            const response = await drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id, name, webViewLink'
            });

            res.json({
                message: 'Backup-ul a fost încărcat cu succes în Google Drive!',
                fileDetails: response.data
            });
        });
    } catch (error) {
        console.error('Error uploading to Google Drive:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});