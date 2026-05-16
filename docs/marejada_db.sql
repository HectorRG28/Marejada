// backend/app.js
const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const authRoutes        = require('./src/routes/authRoutes');
const planesRoutes      = require('./src/routes/planesRoutes');
const etiquetasRoutes   = require('./src/routes/etiquetasRoutes');
const valoracionesRoutes= require('./src/routes/valoracionesRoutes');
const favoritosRoutes   = require('./src/routes/favoritosRoutes');
const chatbotRoutes     = require('./src/routes/chatbotRoutes');
const adminRoutes       = require('./src/routes/adminRoutes');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// Rutas
app.use('/api/auth',        authRoutes);
app.use('/api/planes',      planesRoutes);
app.use('/api/etiquetas',   etiquetasRoutes);
app.use('/api/valoraciones',valoracionesRoutes);
app.use('/api/favoritos',   favoritosRoutes);
app.use('/api/chatbot',     chatbotRoutes);
app.use('/api/admin',       adminRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', app: 'Marejada API' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌊 Marejada API corriendo en http://localhost:${PORT}`));