// resetPassword.js
// Ejecutar desde la carpeta bakend:  node resetPassword.js

const bcrypt = require('bcryptjs');
require('dotenv').config();
const db = require('./src/config/db');

async function reset() {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    console.log('Hash generado:', hash);

    await db.query(
      'UPDATE usuarios SET password = ? WHERE email = ?',
      [hash, 'admin@marejada.es']
    );
    console.log('✅ Contraseña del admin reseteada a: admin123');

    await db.query(
      'UPDATE usuarios SET password = ? WHERE email = ?',
      [hash, 'sara@demo.com']
    );
    console.log('✅ Contraseña de sara reseteada a: admin123');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

reset();