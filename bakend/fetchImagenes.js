// Ejecutar desde bakend/: node fetchImagenes.js
// Asigna UNA foto por provincia (5 peticiones total, nunca supera el límite)

require('dotenv').config();
const mysql = require('mysql2/promise');

const UNSPLASH_KEY = 'HZqock9Hn63AnkoJ0wVJWIK_HRRHlkQGReW1hWEXVus';

// Queries específicas por provincia
const IMGS_PROVINCIA = {
  'Málaga':  'Marbella beach spain mediterranean',
  'Almería': 'Cabo de Gata beach spain',
  'Cádiz':   'Cadiz beach spain atlantic',
  'Granada': 'Almunecar beach spain',
  'Huelva':  'Huelva beach spain atlantic pine',
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const main = async () => {
  const db = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'marejada',
  });
  console.log('✅ Conectado a MySQL');

  const urlsProv = {};

  // Solo 5 peticiones — una por provincia
  for (const [prov, query] of Object.entries(IMGS_PROVINCIA)) {
    process.stdout.write(`Buscando foto para ${prov}... `);
    try {
      const res  = await fetch(
        `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&client_id=${UNSPLASH_KEY}`
      );
      const data = await res.json();
      const url  = data?.urls?.regular;
      if (url) {
        urlsProv[prov] = url;
        console.log('✅');
      } else {
        console.log('❌', data?.errors?.[0] || 'sin resultado');
      }
    } catch (err) {
      console.log('❌', err.message);
    }
    await sleep(500);
  }

  // Actualizar todas las playas de cada provincia con su foto
  for (const [prov, url] of Object.entries(urlsProv)) {
    const [res] = await db.query(
      'UPDATE planes SET imagen_url = ? WHERE provincia = ?',
      [url, prov]
    );
    console.log(`✅ ${prov}: ${res.affectedRows} playas actualizadas`);
  }

  await db.end();
  console.log('\n🎉 Listo — recarga el catálogo');
};

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});