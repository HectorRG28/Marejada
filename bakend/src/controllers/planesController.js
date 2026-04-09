const db = require('../config/db');

// ─── Utilidad interna ────────────────────────────────────────────────────────
/**
 * Dado un plan_id, devuelve el array de etiquetas asociadas.
 */
async function _etiquetasDePlan(planId) {
  const [rows] = await db.query(
    `SELECT e.id, e.nombre
     FROM etiquetas e
     JOIN plan_etiquetas pe ON pe.etiqueta_id = e.id
     WHERE pe.plan_id = ?`,
    [planId]
  );
  return rows;
}

// ─── GET /planes ─────────────────────────────────────────────────────────────
// Query params opcionales: provincia, etiquetas (csv), page, limit
async function listar(req, res) {
  try {
    const { provincia, etiquetas, page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT DISTINCT p.id, p.titulo, p.descripcion, p.provincia,
             p.imagen_url, p.activo, p.creado_en,
             vvm.valoracion_media, vvm.total_valoraciones
      FROM planes p
      LEFT JOIN vista_valoraciones_medias vvm ON vvm.plan_id = p.id
    `;
    const params = [];

    // Filtro por etiquetas (AND: el plan debe tener TODAS las etiquetas pedidas)
    if (etiquetas) {
      const lista = etiquetas.split(',').map(e => e.trim()).filter(Boolean);
      if (lista.length > 0) {
        query += `
          JOIN plan_etiquetas pe_f ON pe_f.plan_id = p.id
          JOIN etiquetas e_f      ON e_f.id = pe_f.etiqueta_id
                                 AND e_f.nombre IN (${lista.map(() => '?').join(',')})
        `;
        params.push(...lista);

        // Asegurar que tiene TODAS las etiquetas pedidas
        query += `
          GROUP BY p.id
          HAVING COUNT(DISTINCT e_f.nombre) = ?
        `;
        params.push(lista.length);
      }
    } else {
      query += ' GROUP BY p.id';
    }

    query += ' WHERE 1=1';

    // Filtro por provincia
    if (provincia) {
      query += ' AND p.provincia = ?';
      params.push(provincia);
    }

    // Solo activos para usuarios normales
    query += ' AND p.activo = 1';

    query += ' ORDER BY vvm.valoracion_media DESC, p.creado_en DESC';
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    // La consulta con HAVING + WHERE tiene que ir en orden correcto
    // Reconstruimos correctamente:
    const queryFinal = construirQueryPlanes({ provincia, etiquetas, limit, offset });
    const paramsFinal = construirParamsPlanes({ provincia, etiquetas, limit, offset });

    const [planes] = await db.query(queryFinal, paramsFinal);

    // Añadir etiquetas a cada plan
    const planesConEtiquetas = await Promise.all(
      planes.map(async (p) => ({
        ...p,
        etiquetas: await _etiquetasDePlan(p.id),
      }))
    );

    return res.json(planesConEtiquetas);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ─── GET /planes/:id ──────────────────────────────────────────────────────────
async function detalle(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT p.*, vvm.valoracion_media, vvm.total_valoraciones
       FROM planes p
       LEFT JOIN vista_valoraciones_medias vvm ON vvm.plan_id = p.id
       WHERE p.id = ? AND p.activo = 1`,
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Plan no encontrado' });

    const plan = rows[0];
    plan.etiquetas = await _etiquetasDePlan(plan.id);

    // Últimas 10 valoraciones visibles
    const [valoraciones] = await db.query(
      `SELECT v.id, v.puntuacion, v.comentario, v.creado_en,
              u.nombre AS autor
       FROM valoraciones v
       JOIN usuarios u ON u.id = v.usuario_id
       WHERE v.plan_id = ? AND v.visible = 1
       ORDER BY v.creado_en DESC
       LIMIT 10`,
      [id]
    );
    plan.valoraciones = valoraciones;

    return res.json(plan);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ─── Helpers de construcción de query ────────────────────────────────────────
function construirQueryPlanes({ provincia, etiquetas, limit, offset }) {
  const lista = etiquetas
    ? etiquetas.split(',').map(e => e.trim()).filter(Boolean)
    : [];

  let q = `
    SELECT p.id, p.titulo, p.descripcion, p.provincia,
           p.imagen_url, p.activo, p.creado_en,
           vvm.valoracion_media, vvm.total_valoraciones
    FROM planes p
    LEFT JOIN vista_valoraciones_medias vvm ON vvm.plan_id = p.id
  `;

  if (lista.length > 0) {
    q += `
      JOIN plan_etiquetas pe_f ON pe_f.plan_id = p.id
      JOIN etiquetas e_f      ON e_f.id = pe_f.etiqueta_id
    `;
  }

  q += ' WHERE p.activo = 1';

  if (provincia) q += ' AND p.provincia = ?';

  if (lista.length > 0) {
    q += ` AND e_f.nombre IN (${lista.map(() => '?').join(',')})`;
    q += ' GROUP BY p.id';
    q += ` HAVING COUNT(DISTINCT e_f.nombre) = ?`;
  } else {
    q += ' GROUP BY p.id';
  }

  q += ' ORDER BY vvm.valoracion_media DESC, p.creado_en DESC';
  q += ' LIMIT ? OFFSET ?';

  return q;
}

function construirParamsPlanes({ provincia, etiquetas, limit, offset }) {
  const lista = etiquetas
    ? etiquetas.split(',').map(e => e.trim()).filter(Boolean)
    : [];

  const params = [];
  if (provincia) params.push(provincia);
  if (lista.length > 0) {
    params.push(...lista);
    params.push(lista.length);
  }
  params.push(parseInt(limit), parseInt(offset));
  return params;
}

module.exports = { listar, detalle };
