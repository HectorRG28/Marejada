const bcrypt = require('bcryptjs');
const db = require('../config/db');

// GET /usuarios/perfil
async function perfil(req, res) {
  try {
    const [rows] = await db.query(
      'SELECT id, nombre, email, rol, creado_en FROM usuarios WHERE id = ?',
      [req.usuario.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// PUT /usuarios/perfil  — Actualizar nombre o contraseña
async function actualizarPerfil(req, res) {
  const { nombre, passwordActual, passwordNueva } = req.body;
  const usuario_id = req.usuario.id;

  try {
    const [rows] = await db.query(
      'SELECT id, nombre, password FROM usuarios WHERE id = ?',
      [usuario_id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const usuario = rows[0];
    const updates = [];
    const params = [];

    if (nombre) {
      updates.push('nombre = ?');
      params.push(nombre);
    }

    if (passwordNueva) {
      if (!passwordActual) {
        return res.status(400).json({ error: 'Debes confirmar tu contraseña actual' });
      }
      const coincide = await bcrypt.compare(passwordActual, usuario.password);
      if (!coincide) {
        return res.status(401).json({ error: 'Contraseña actual incorrecta' });
      }
      const hash = await bcrypt.hash(passwordNueva, 10);
      updates.push('password = ?');
      params.push(hash);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay datos que actualizar' });
    }

    params.push(usuario_id);
    await db.query(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`, params);

    return res.json({ mensaje: 'Perfil actualizado correctamente' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// GET /usuarios/favoritos
async function listarFavoritos(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.titulo, p.descripcion, p.provincia, p.imagen_url,
              f.guardado_en,
              vvm.valoracion_media, vvm.total_valoraciones
       FROM favoritos f
       JOIN planes p ON p.id = f.plan_id AND p.activo = 1
       LEFT JOIN vista_valoraciones_medias vvm ON vvm.plan_id = p.id
       WHERE f.usuario_id = ?
       ORDER BY f.guardado_en DESC`,
      [req.usuario.id]
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// POST /usuarios/favoritos/:planId
async function agregarFavorito(req, res) {
  const { planId } = req.params;
  const usuario_id = req.usuario.id;

  try {
    const [planes] = await db.query('SELECT id FROM planes WHERE id = ? AND activo = 1', [planId]);
    if (planes.length === 0) return res.status(404).json({ error: 'Plan no encontrado' });

    await db.query(
      'INSERT INTO favoritos (usuario_id, plan_id) VALUES (?, ?)',
      [usuario_id, planId]
    );
    return res.status(201).json({ mensaje: 'Plan añadido a favoritos' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Este plan ya está en tus favoritos' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// DELETE /usuarios/favoritos/:planId
async function eliminarFavorito(req, res) {
  const { planId } = req.params;
  const usuario_id = req.usuario.id;

  try {
    const [result] = await db.query(
      'DELETE FROM favoritos WHERE usuario_id = ? AND plan_id = ?',
      [usuario_id, planId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Favorito no encontrado' });
    }
    return res.json({ mensaje: 'Plan eliminado de favoritos' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// GET /usuarios/mis-valoraciones
async function misValoraciones(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT v.id, v.puntuacion, v.comentario, v.creado_en,
              p.id AS plan_id, p.titulo AS plan_titulo, p.provincia
       FROM valoraciones v
       JOIN planes p ON p.id = v.plan_id
       WHERE v.usuario_id = ?
       ORDER BY v.creado_en DESC`,
      [req.usuario.id]
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = {
  perfil,
  actualizarPerfil,
  listarFavoritos,
  agregarFavorito,
  eliminarFavorito,
  misValoraciones,
};
