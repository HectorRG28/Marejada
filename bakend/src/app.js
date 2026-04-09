require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

// ── Middlewares globales ──────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173', // Puerto por defecto de Vite
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/auth',        require('./routes/auth'));
app.use('/planes',      require('./routes/planes'));
app.use('/etiquetas',   require('./routes/etiquetas'));
app.use('/valoraciones',require('./routes/valoraciones'));
app.use('/usuarios',    require('./routes/usuarios'));
app.use('/admin',       require('./routes/admin'));
app.use('/chatbot',     require('./routes/chatbot'));

// ── Ruta raíz (health check) ──────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ mensaje: '🌊 Marejada API funcionando', version: '1.0.0' });
});

// ── Manejador de rutas no encontradas ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// ── Manejador global de errores ───────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ── Arranque ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Marejada escuchando en http://localhost:${PORT}`);
});
