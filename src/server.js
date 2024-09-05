const express = require('express');
const { resolve } = require('path');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the 'public' directory
app.use(express.static(('./src/public/')));

app.get('/', (req, res) => {
    res.sendFile(resolve(__dirname, './public/index.html'));
});

app.get('/api', (req, res) => {
    res.send('Welcome to AI Workshop');
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});