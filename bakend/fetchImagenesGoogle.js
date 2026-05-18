// Ejecutar desde bakend/: node fetchImagenesGoogle.js
// Usa Places API (New) — la versión moderna de Google
require('dotenv').config();
const mysql = require('mysql2/promise');

const GOOGLE_KEY = 'AIzaSyD_pMJfLAljI1h_zc14XI7GK2-ODGw_DUk';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Places API (New) — Text Search
const buscarFoto = async (nombre, provincia) => {
  const textQuery = `playa ${nombre} ${provincia} Andalucía España`;

  // Paso 1: Text Search (New)
  const searchRes = await fetch(
    `https://places.googleapis.com/v1/places:searchText`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_KEY,
        'X-Goog-FieldMask': 'places.id,places.photos',
      },
      body: JSON.stringify({ textQuery, languageCode: 'es' }),
    }
  );

  const searchData = await searchRes.json();

  if (searchData.error) {
    throw new Error(`${searchData.error.message}`);
  }

  const lugar = searchData?.places?.[0];
  if (!lugar?.id) return null;

  const foto = lugar?.photos?.[0];
  if (!foto?.name) return null;

  // Paso 2: obtener URL de la foto
  const fotoRes = await fetch(
    `https://places.googleapis.com/v1/${foto.name}/media?maxWidthPx=600&skipHttpRedirect=true`,
    {
      headers: { 'X-Goog-Api-Key': GOOGLE_KEY },
    }
  );
  const fotoData = await fotoRes.json();
  return fotoData?.photoUri || null;
};

const main = async () => {
  const db = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'marejada',
  });
  console.log('✅ Conectado a MySQL');

  const [planes] = await db.query(
    'SELECT id, titulo, provincia FROM planes WHERE imagen_url IS NULL OR imagen_url = "" ORDER BY id'
  );
  console.log(`📋 ${planes.length} playas sin imagen\n`);

  // Test con primera playa
  console.log(`🔍 Probando con: ${planes[0].titulo}...`);
  try {
    const testUrl = await buscarFoto(planes[0].titulo, planes[0].provincia);
    if (testUrl) {
      console.log(`✅ API funcionando correctamente\n`);
    } else {
      console.log(`⚠️  API responde pero no encontró foto para la primera playa — continuando\n`);
    }
  } catch (err) {
    console.log(`❌ Error: ${err.message}\n`);
    console.log('Comprueba que "Places API (New)" está habilitada en:');
    console.log('https://console.cloud.google.com/apis/library/places.googleapis.com\n');
    await db.end();
    process.exit(1);
  }

  let ok = 0, fail = 0;

  for (const plan of planes) {
    process.stdout.write(`[${plan.id}] ${plan.titulo}... `);
    try {
      let url = await buscarFoto(plan.titulo, plan.provincia);

      // Si no encuentra por nombre, buscar genérico por provincia
      if (!url) {
        url = await buscarFoto(`costa playa`, plan.provincia);
      }

      if (url) {
        await db.query('UPDATE planes SET imagen_url = ? WHERE id = ?', [url, plan.id]);
        console.log('✅');
        ok++;
      } else {
        console.log('❌');
        fail++;
      }
    } catch (err) {
      console.log(`❌ ${err.message}`);
      fail++;
    }
    await sleep(200);
  }

  await db.end();
  console.log(`\n🎉 Completado: ${ok} con foto, ${fail} sin foto`);
  console.log(`💰 Coste estimado: €${(ok * 0.017).toFixed(2)}`);
};

main().catch(err => { console.error(err.message); process.exit(1); });