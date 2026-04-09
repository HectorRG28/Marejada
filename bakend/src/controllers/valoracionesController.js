const db = require('../config/db');

// GET /valoraciones/plan/:planId  — Valoraciones públicas de un plan
async function porPlan(req, res) {
  try {
    const { planId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [rows] = await db.query(
      `SELECT v.id, v.puntuacion, v.comentario, v.creado_en,
              u.nombre AS autor
       FROM valoraciones v
       JOIN usuarios u ON u.id = v.usuario_id
       WHERE v.plan_id = ? AND v.visible = 1
       ORDER BY v.creado_en DESC
       LIMIT ? OFFSET ?`,
      [planId, parseInt(limit), offset]
    );

    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// POST /valoraciones  — Crear valoración (usuario autenticado)
async function crear(req, res) {
  const { plan_id, puntuacion, comentario } = req.body;
  const usuario_id = req.usuario.id;

  if (!plan_id || !puntuacion) {
    return res.status(400).json({ error: 'plan_id y puntuacion son obligatorios' });
  }
  if (puntuacion < 1 || puntuacion > 5) {
    return res.status(400).json({ error: 'La puntuación debe estar entre 1 y 5' });
  }

  try {
    // Verificar que el plan existe y está activo
    const [planes] = await db.query('SELECT id FROM planes WHERE id = ? AND activo = 1', [plan_id]);
    if (planes.length === 0) return res.status(404).json({ error: 'Plan no encontrado' });

    await db.query(
      `INSERT INTO valoraciones (usuario_id, plan_id, puntuacion, comentario)
       VALUES (?, ?, ?, ?)`,
      [usuario_id, plan_id, puntuacion, comentario || null]
    );

    return res.status(201).json({ mensaje: 'Valoración guardada correctamente' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya has valorado este plan' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// PUT /valoraciones/:id  — Editar la propia valoración
async function editar(req, res) {
  const { id } = req.params;
  const { puntuacion, comentario } = req.body;
  const usuario_id = req.usuario.id;

  if (puntuacion && (puntuacion < 1 || puntuacion > 5)) {
    return res.status(400).json({ error: 'La puntuación debe estar entre 1 y 5' });
  }

  try {
    const [rows] = await db.query(
      'SELECT id, usuario_id FROM valoraciones WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Valoración no encontrada' });

    // Solo el propio usuario puede editar su valoración
    if (rows[0].usuario_id !== usuario_id && req.usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso para editar esta valoración' });
    }

    await db.query(
      `UPDATE valoraciones
       SET puntuacion = COALESCE(?, puntuacion),
           comentario = COALESCE(?, comentario)
       WHERE id = ?`,
      [puntuacion || null, comentario ?? null, id]
    );

    return res.json({ mensaje: 'Valoración actualizada' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// DELETE /valoraciones/:id  — Eliminar la propia valoración
async function eliminar(req, res) {
  const { id } = req.params;
  const usuario_id = req.usuario.id;

  try {
    const [rows] = await db.query(
      'SELECT id, usuario_id FROM valoraciones WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Valoración no encontrada' });

    if (rows[0].usuario_id !== usuario_id && req.usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta valoración' });
    }

    await db.query('DELETE FROM valoraciones WHERE id = ?', [id]);
    return res.json({ mensaje: 'Valoración eliminada' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { porPlan, crear, editar, eliminar };
