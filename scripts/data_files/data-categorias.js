// scripts/seed/data-categorias.js
//
// Carga la colección 'categorias'. No depende de ninguna otra colección,
// por eso se carga primero.

const { getDb, closeConnection } = require('../../db/connection');

const categorias = [
  { nombre: 'Insumos de oficina', descripcion: 'Resmas, lapiceras, carpetas y artículos de escritorio' },
  { nombre: 'Tecnología', descripcion: 'Periféricos, cables y accesorios informáticos' },
  { nombre: 'Limpieza', descripcion: 'Productos de limpieza e higiene para el local' },
  { nombre: 'Mobiliario', descripcion: 'Sillas, escritorios y muebles de oficina' },
];

async function seedCategorias(db) {
  const coleccion = db.collection('categorias');

  await coleccion.deleteMany({});
  const resultado = await coleccion.insertMany(categorias);

  console.log('=== CATEGORIAS ===');
  console.log(`Insertadas: ${resultado.insertedCount}`);

  return Object.values(resultado.insertedIds);
}

if (require.main === module) {
  (async () => {
    const db = await getDb();
    await seedCategorias(db);
    await closeConnection();
  })();
}

module.exports = { seedCategorias, categorias };