const db = require('../config/db');

// ── GET /valoraciones/plan/:planId ────────────────────────────────────────────
async function porPlan(req, res) {
  const { planId } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT v.id, v.puntuacion, v.comentario, v.fecha,
              u.id AS usuario_id, u.nombre AS usuario_nombre
       FROM valoraciones v
       JOIN usuarios u ON u.id = v.usuario_id
       WHERE v.plan_id = ?
       ORDER BY v.fecha DESC`,
      [planId]
    );
    return res.json(rows);
  } catch (err) {
    console.error('porPlan error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ── POST /valoraciones ────────────────────────────────────────────────────────
async function crear(req, res) {
  const { plan_id, puntuacion, comentario } = req.body;
  const usuario_id = req.usuario?.id;

  if (!usuario_id)
    return res.status(401).json({ error: 'No autenticado' });

  if (!plan_id || puntuacion === undefined)
    return res.status(400).json({ error: 'plan_id y puntuacion son obligatorios' });

  const pun = parseInt(puntuacion, 10);
  if (isNaN(pun) || pun < 1 || pun > 5)
    return res.status(400).json({ error: 'puntuacion debe ser un número entre 1 y 5' });

  try {
    const [plan] = await db.query('SELECT id FROM planes WHERE id = ? AND activo = 1', [plan_id]);
    if (plan.length === 0)
      return res.status(404).json({ error: 'Plan no encontrado' });

    const [yaValorado] = await db.query(
      'SELECT id FROM valoraciones WHERE usuario_id = ? AND plan_id = ?',
      [usuario_id, plan_id]
    );
    if (yaValorado.length > 0)
      return res.status(409).json({ error: 'Ya has valorado este plan. Puedes editarla o eliminarla.' });

    const [result] = await db.query(
      'INSERT INTO valoraciones (usuario_id, plan_id, puntuacion, comentario) VALUES (?, ?, ?, ?)',
      [usuario_id, plan_id, pun, comentario || null]
    );

    return res.status(201).json({
      id: result.insertId,
      usuario_id,
      plan_id,
      puntuacion: pun,
      comentario: comentario || null,
    });
  } catch (err) {
    console.error('crear valoracion error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ── PUT /valoraciones/:id ─────────────────────────────────────────────────────
async function editar(req, res) {
  const { id } = req.params;
  const { puntuacion, comentario } = req.body;
  const usuario_id = req.usuario?.id;

  if (puntuacion !== undefined) {
    const pun = parseInt(puntuacion, 10);
    if (isNaN(pun) || pun < 1 || pun > 5)
      return res.status(400).json({ error: 'puntuacion debe estar entre 1 y 5' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM valoraciones WHERE id = ?', [id]);
    if (rows.length === 0)
      return res.status(404).json({ error: 'Valoración no encontrada' });

    if (rows[0].usuario_id !== usuario_id && req.usuario.rol !== 'admin')
      return res.status(403).json({ error: 'No tienes permiso para editar esta valoración' });

    await db.query(
      `UPDATE valoraciones
       SET puntuacion = COALESCE(?, puntuacion),
           comentario = COALESCE(?, comentario)
       WHERE id = ?`,
      [puntuacion || null, comentario || null, id]
    );

    return res.json({ mensaje: 'Valoración actualizada correctamente' });
  } catch (err) {
    console.error('editar valoracion error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ── DELETE /valoraciones/:id ──────────────────────────────────────────────────
async function eliminar(req, res) {
  const { id } = req.params;
  const { id: usuario_id, rol } = req.usuario;

  try {
    const [rows] = await db.query('SELECT * FROM valoraciones WHERE id = ?', [id]);
    if (rows.length === 0)
      return res.status(404).json({ error: 'Valoración no encontrada' });

    if (rows[0].usuario_id !== usuario_id && rol !== 'admin')
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta valoración' });

    await db.query('DELETE FROM valoraciones WHERE id = ?', [id]);
    return res.json({ mensaje: 'Valoración eliminada correctamente' });
  } catch (err) {
    console.error('eliminar valoracion error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// porPlan y listarPorPlan apuntan a la misma función para compatibilidad
module.exports = { porPlan, listarPorPlan: porPlan, crear, editar, eliminar };