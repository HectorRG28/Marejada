const db      = require('../config/db');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');

async function register(req, res) {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password)
    return res.status(400).json({ error: 'nombre, email y password son obligatorios' });

  try {
    const [existe] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email.trim()]);
    if (existe.length > 0)
      return res.status(409).json({ error: 'El email ya está registrado' });

    const hash = await bcrypt.hash(password.trim(), 10);
    const [result] = await db.query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, "user")',
      [nombre.trim(), email.trim(), hash]
    );

    return res.status(201).json({ id: result.insertId, nombre, email, rol: 'user' });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'email y password son obligatorios' });

  // ✅ trim() elimina espacios accidentales al inicio y al final
  const emailLimpio    = email.trim();
  const passwordLimpio = password.trim();

  try {
    const [rows] = await db.query(
      'SELECT id, nombre, email, password, rol FROM usuarios WHERE email = ?',
      [emailLimpio]
    );

    if (rows.length === 0)
      return res.status(401).json({ error: 'Credenciales incorrectas' });

    const user = rows[0];
    const valida = await bcrypt.compare(passwordLimpio, user.password);

    if (!valida)
      return res.status(401).json({ error: 'Credenciales incorrectas' });

    const token = jwt.sign(
      { id: user.id, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({
      token,
      usuario: {
        id:     user.id,
        nombre: user.nombre,
        email:  user.email,
        rol:    user.rol,
      },
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function me(req, res) {
  try {
    const [rows] = await db.query(
      'SELECT id, nombre, email, rol, created_at FROM usuarios WHERE id = ?',
      [req.usuario.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: 'Usuario no encontrado' });

    return res.json(rows[0]);
  } catch (err) {
    console.error('me error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { register, login, me };