const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Vocab API is running successfully' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});