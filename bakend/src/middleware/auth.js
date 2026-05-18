const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticación JWT.
 * Lee el token del header Authorization: Bearer <token>
 * Si es válido, adjunta req.usuario = { id, rol }
 */
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // ✅ CORRECCIÓN: comprobar que existe y empieza por "Bearer "
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido. Inicia sesión para continuar.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // jwt.verify lanza si el token es inválido o ha caducado
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o caducado. Inicia sesión de nuevo.' });
  }
};