const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// API routes
app.get('/api/health', (req, res) => res.json({ ok: true, name: 'Pixel Bloom API', timestamp: Date.now() }));
app.get('/ping', (req, res) => res.status(200).send('pong'));
app.use('/api/generate-image', require('./routes/generate'));

// Block access to backend folder when serving static files
app.use(['/backend', '/backend/*'], (req, res) => res.status(404).end());

// Serve frontend statically from project root
const clientDir = path.join(__dirname, '..');
app.use(express.static(clientDir));
app.get('/', (_, res) => res.sendFile(path.join(clientDir, 'index.html')));

const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => console.log(`[Pixel Bloom] API + Frontend available at http://0.0.0.0:${port}`));
