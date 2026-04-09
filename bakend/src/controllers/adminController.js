const db = require('../config/db');

// ════════════════════════════════════════════════════════════
//  PLANES
// ════════════════════════════════════════════════════════════

// GET /admin/planes  — Lista todos (incluso inactivos)
async function listarPlanesAdmin(req, res) {
  try {
    const { page = 1, limit = 20, provincia, activo } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let q = `
      SELECT p.id, p.titulo, p.provincia, p.activo, p.creado_en,
             vvm.valoracion_media, vvm.total_valoraciones
      FROM planes p
      LEFT JOIN vista_valoraciones_medias vvm ON vvm.plan_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (provincia) { q += ' AND p.provincia = ?'; params.push(provincia); }
    if (activo !== undefined) { q += ' AND p.activo = ?'; params.push(activo); }

    q += ' ORDER BY p.creado_en DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await db.query(q, params);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// POST /admin/planes
async function crearPlan(req, res) {
  const { titulo, descripcion, provincia, imagen_url, etiquetas = [] } = req.body;

  if (!titulo || !descripcion || !provincia) {
    return res.status(400).json({ error: 'titulo, descripcion y provincia son obligatorios' });
  }

  const provinciasValidas = ['Almería', 'Cádiz', 'Granada', 'Huelva', 'Málaga'];
  if (!provinciasValidas.includes(provincia)) {
    return res.status(400).json({ error: `Provincia no válida. Opciones: ${provinciasValidas.join(', ')}` });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      'INSERT INTO planes (titulo, descripcion, provincia, imagen_url) VALUES (?, ?, ?, ?)',
      [titulo, descripcion, provincia, imagen_url || null]
    );
    const planId = result.insertId;

    await _asignarEtiquetas(conn, planId, etiquetas);

    await conn.commit();
    return res.status(201).json({ mensaje: 'Plan creado', id: planId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    conn.release();
  }
}

// PUT /admin/planes/:id
async function editarPlan(req, res) {
  const { id } = req.params;
  const { titulo, descripcion, provincia, imagen_url, activo, etiquetas } = req.body;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const updates = [];
    const params = [];

    if (titulo)       { updates.push('titulo = ?');       params.push(titulo); }
    if (descripcion)  { updates.push('descripcion = ?');  params.push(descripcion); }
    if (provincia)    { updates.push('provincia = ?');    params.push(provincia); }
    if (imagen_url !== undefined) { updates.push('imagen_url = ?'); params.push(imagen_url); }
    if (activo !== undefined)     { updates.push('activo = ?');     params.push(activo ? 1 : 0); }

    if (updates.length > 0) {
      params.push(id);
      await conn.query(`UPDATE planes SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    if (Array.isArray(etiquetas)) {
      await conn.query('DELETE FROM plan_etiquetas WHERE plan_id = ?', [id]);
      await _asignarEtiquetas(conn, id, etiquetas);
    }

    await conn.commit();
    return res.json({ mensaje: 'Plan actualizado' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    conn.release();
  }
}

// DELETE /admin/planes/:id
async function eliminarPlan(req, res) {
  try {
    const [result] = await db.query('DELETE FROM planes WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Plan no encontrado' });
    return res.json({ mensaje: 'Plan eliminado' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ════════════════════════════════════════════════════════════
//  ETIQUETAS
// ════════════════════════════════════════════════════════════

// POST /admin/etiquetas
async function crearEtiqueta(req, res) {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

  try {
    const [result] = await db.query('INSERT INTO etiquetas (nombre) VALUES (?)', [nombre]);
    return res.status(201).json({ mensaje: 'Etiqueta creada', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe una etiqueta con ese nombre' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// PUT /admin/etiquetas/:id
async function editarEtiqueta(req, res) {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

  try {
    const [result] = await db.query(
      'UPDATE etiquetas SET nombre = ? WHERE id = ?',
      [nombre, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Etiqueta no encontrada' });
    return res.json({ mensaje: 'Etiqueta actualizada' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe una etiqueta con ese nombre' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// DELETE /admin/etiquetas/:id
async function eliminarEtiqueta(req, res) {
  try {
    const [result] = await db.query('DELETE FROM etiquetas WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Etiqueta no encontrada' });
    return res.json({ mensaje: 'Etiqueta eliminada' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ════════════════════════════════════════════════════════════
//  MODERACIÓN DE VALORACIONES
// ════════════════════════════════════════════════════════════

// GET /admin/valoraciones  — Todas las valoraciones
async function listarValoraciones(req, res) {
  const { visible, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let q = `
      SELECT v.id, v.puntuacion, v.comentario, v.visible, v.creado_en,
             u.nombre AS autor, u.email,
             p.titulo AS plan_titulo, p.id AS plan_id
      FROM valoraciones v
      JOIN usuarios u ON u.id = v.usuario_id
      JOIN planes p   ON p.id = v.plan_id
      WHERE 1=1
    `;
    const params = [];

    if (visible !== undefined) { q += ' AND v.visible = ?'; params.push(visible); }

    q += ' ORDER BY v.creado_en DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await db.query(q, params);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// PATCH /admin/valoraciones/:id/visibilidad  — Ocultar / mostrar
async function cambiarVisibilidad(req, res) {
  const { visible } = req.body;
  if (visible === undefined) return res.status(400).json({ error: 'visible es obligatorio' });

  try {
    const [result] = await db.query(
      'UPDATE valoraciones SET visible = ? WHERE id = ?',
      [visible ? 1 : 0, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Valoración no encontrada' });
    return res.json({ mensaje: `Valoración ${visible ? 'publicada' : 'ocultada'}` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// DELETE /admin/valoraciones/:id
async function eliminarValoracion(req, res) {
  try {
    const [result] = await db.query('DELETE FROM valoraciones WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Valoración no encontrada' });
    return res.json({ mensaje: 'Valoración eliminada' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ════════════════════════════════════════════════════════════
//  USUARIOS (gestión admin)
// ════════════════════════════════════════════════════════════

// GET /admin/usuarios
async function listarUsuarios(req, res) {
  const { page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const [rows] = await db.query(
      `SELECT id, nombre, email, rol, creado_en FROM usuarios
       ORDER BY creado_en DESC LIMIT ? OFFSET ?`,
      [parseInt(limit), offset]
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// PATCH /admin/usuarios/:id/rol
async function cambiarRol(req, res) {
  const { rol } = req.body;
  if (!['usuario', 'admin'].includes(rol)) {
    return res.status(400).json({ error: 'Rol no válido. Opciones: usuario, admin' });
  }

  try {
    const [result] = await db.query(
      'UPDATE usuarios SET rol = ? WHERE id = ?',
      [rol, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json({ mensaje: `Rol actualizado a '${rol}'` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ─── Utilidad interna ────────────────────────────────────────────────────────
/**
 * Asigna etiquetas a un plan por ID o por nombre.
 * etiquetas: array de IDs (number) o nombres (string)
 */
async function _asignarEtiquetas(conn, planId, etiquetas) {
  if (!etiquetas || etiquetas.length === 0) return;

  for (const e of etiquetas) {
    let etiquetaId;

    if (typeof e === 'number') {
      etiquetaId = e;
    } else {
      // Buscar por nombre; si no existe, crear
      const [rows] = await conn.query(
        'SELECT id FROM etiquetas WHERE nombre = ?', [e]
      );
      if (rows.length > 0) {
        etiquetaId = rows[0].id;
      } else {
        const [ins] = await conn.query('INSERT INTO etiquetas (nombre) VALUES (?)', [e]);
        etiquetaId = ins.insertId;
      }
    }

    await conn.query(
      'INSERT IGNORE INTO plan_etiquetas (plan_id, etiqueta_id) VALUES (?, ?)',
      [planId, etiquetaId]
    );
  }
}

module.exports = {
  listarPlanesAdmin,
  crearPlan,
  editarPlan,
  eliminarPlan,
  crearEtiqueta,
  editarEtiqueta,
  eliminarEtiqueta,
  listarValoraciones,
  cambiarVisibilidad,
  eliminarValoracion,
  listarUsuarios,
  cambiarRol,
};
