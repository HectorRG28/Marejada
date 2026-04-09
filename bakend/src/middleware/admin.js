/**
 * Debe usarse DESPUÉS de authMiddleware.
 * Rechaza la petición si el usuario no tiene rol 'admin'.
 */
function adminMiddleware(req, res, next) {
  if (req.usuario?.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso restringido a administradores' });
  }
  next();
}

module.exports = adminMiddleware;
