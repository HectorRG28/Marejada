const db = require('../config/db');

// GET /etiquetas
async function listar(req, res) {
  try {
    const [rows] = await db.query('SELECT id, nombre FROM etiquetas ORDER BY nombre ASC');
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { listar };
