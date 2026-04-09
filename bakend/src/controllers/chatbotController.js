const db = require('../config/db');

/**
 * Mapa de preguntas del chatbot → etiquetas asociadas.
 *
 * El frontend guía al usuario por el flujo paso a paso.
 * Cada respuesta del usuario se traduce en una o varias etiquetas.
 * El backend recibe el objeto "respuestas" y devuelve planes recomendados.
 */

// POST /chatbot/recomendar
// Body: { respuestas: { acompañantes, actividades[], tranquilidad, accesible } }
async function recomendar(req, res) {
  const { respuestas } = req.body;

  if (!respuestas) {
    return res.status(400).json({ error: 'Se requiere el objeto "respuestas"' });
  }

  // ── Traducir respuestas a etiquetas ──────────────────────────────────────
  const etiquetasSeleccionadas = new Set();

  // 1. Acompañantes
  const mapaAcompañantes = {
    solo:    ['tranquilidad', 'naturaleza'],
    pareja:  ['pareja', 'tranquilidad'],
    familia: ['familia', 'accesible'],
    amigos:  ['aventura', 'deporte'],
  };
  if (respuestas.acompañantes && mapaAcompañantes[respuestas.acompañantes]) {
    mapaAcompañantes[respuestas.acompañantes].forEach(e => etiquetasSeleccionadas.add(e));
  }

  // 2. Actividades preferidas (puede ser array)
  const mapaActividades = {
    baño:        ['tranquilidad', 'familia'],
    senderismo:  ['naturaleza', 'aventura', 'deporte'],
    gastronomía: ['gastronomía'],
    surf:        ['deporte', 'aventura'],
    cultural:    ['cultural'],
    relax:       ['tranquilidad', 'pareja'],
    snorkel:     ['naturaleza', 'aventura'],
  };
  if (Array.isArray(respuestas.actividades)) {
    respuestas.actividades.forEach(act => {
      if (mapaActividades[act]) {
        mapaActividades[act].forEach(e => etiquetasSeleccionadas.add(e));
      }
    });
  }

  // 3. Nivel de tranquilidad
  if (respuestas.tranquilidad === 'alta') {
    etiquetasSeleccionadas.add('tranquilidad');
  } else if (respuestas.tranquilidad === 'baja') {
    etiquetasSeleccionadas.add('aventura');
  }

  // 4. Accesibilidad
  if (respuestas.accesible === true || respuestas.accesible === 'si') {
    etiquetasSeleccionadas.add('accesible');
  }

  const lista = Array.from(etiquetasSeleccionadas);

  // ── Buscar planes que coincidan con AL MENOS la mitad de las etiquetas ──
  // (más flexible que exigir todas, mejor experiencia de usuario)
  const minCoincidencias = Math.max(1, Math.ceil(lista.length / 2));

  try {
    let planes = [];

    if (lista.length === 0) {
      // Sin preferencias → devolver los mejor valorados
      const [rows] = await db.query(
        `SELECT p.id, p.titulo, p.descripcion, p.provincia, p.imagen_url,
                vvm.valoracion_media, vvm.total_valoraciones
         FROM planes p
         LEFT JOIN vista_valoraciones_medias vvm ON vvm.plan_id = p.id
         WHERE p.activo = 1
         ORDER BY vvm.valoracion_media DESC, vvm.total_valoraciones DESC
         LIMIT 6`
      );
      planes = rows;
    } else {
      const placeholders = lista.map(() => '?').join(',');
      const [rows] = await db.query(
        `SELECT p.id, p.titulo, p.descripcion, p.provincia, p.imagen_url,
                vvm.valoracion_media, vvm.total_valoraciones,
                COUNT(DISTINCT e.nombre) AS coincidencias
         FROM planes p
         JOIN plan_etiquetas pe ON pe.plan_id = p.id
         JOIN etiquetas e       ON e.id = pe.etiqueta_id AND e.nombre IN (${placeholders})
         LEFT JOIN vista_valoraciones_medias vvm ON vvm.plan_id = p.id
         WHERE p.activo = 1
         GROUP BY p.id
         HAVING coincidencias >= ?
         ORDER BY coincidencias DESC, vvm.valoracion_media DESC
         LIMIT 6`,
        [...lista, minCoincidencias]
      );
      planes = rows;
    }

    // Añadir etiquetas a cada plan
    const resultado = await Promise.all(
      planes.map(async (p) => {
        const [etiquetas] = await db.query(
          `SELECT e.id, e.nombre
           FROM etiquetas e
           JOIN plan_etiquetas pe ON pe.etiqueta_id = e.id
           WHERE pe.plan_id = ?`,
          [p.id]
        );
        return { ...p, etiquetas };
      })
    );

    return res.json({
      etiquetasUsadas: lista,
      planes: resultado,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * GET /chatbot/preguntas
 * Devuelve el flujo de preguntas y opciones para que el frontend lo renderice.
 */
function preguntas(req, res) {
  return res.json([
    {
      id: 'acompañantes',
      pregunta: '¿Con quién vas a hacer la escapada?',
      tipo: 'unica',
      opciones: [
        { valor: 'solo',    etiqueta: 'Solo/a' },
        { valor: 'pareja',  etiqueta: 'En pareja' },
        { valor: 'familia', etiqueta: 'Con familia' },
        { valor: 'amigos',  etiqueta: 'Con amigos' },
      ],
    },
    {
      id: 'actividades',
      pregunta: '¿Qué actividades te apetecen?',
      tipo: 'multiple',
      opciones: [
        { valor: 'baño',        etiqueta: 'Baño y playa' },
        { valor: 'senderismo',  etiqueta: 'Senderismo' },
        { valor: 'gastronomía', etiqueta: 'Gastronomía' },
        { valor: 'surf',        etiqueta: 'Surf / deportes acuáticos' },
        { valor: 'cultural',    etiqueta: 'Cultura y patrimonio' },
        { valor: 'relax',       etiqueta: 'Relax y descanso' },
        { valor: 'snorkel',     etiqueta: 'Snorkel / naturaleza marina' },
      ],
    },
    {
      id: 'tranquilidad',
      pregunta: '¿Qué ambiente prefieres?',
      tipo: 'unica',
      opciones: [
        { valor: 'alta',  etiqueta: 'Tranquilo y apartado' },
        { valor: 'media', etiqueta: 'Equilibrado' },
        { valor: 'baja',  etiqueta: 'Animado y con movimiento' },
      ],
    },
    {
      id: 'accesible',
      pregunta: '¿Necesitas que el plan sea accesible para personas con movilidad reducida?',
      tipo: 'unica',
      opciones: [
        { valor: 'si', etiqueta: 'Sí' },
        { valor: 'no', etiqueta: 'No' },
      ],
    },
  ]);
}

module.exports = { recomendar, preguntas };
