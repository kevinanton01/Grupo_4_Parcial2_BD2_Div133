
// Orquestador del seed completo. Corre cada data-*.js en el orden que
// respeta las dependencias entre colecciones.
//
// Uso: npm run seed

const { getDb, closeConnection } = require('../../db/connection');
const { seedCategorias } = require('./data-categorias');
const { seedUsuarios } = require('./data-usuarios');
const { seedProductos } = require('./data-productos');
const { seedMovimientos } = require('./data-movimientos');

async function seedAll() {
  const db = await getDb();

  console.log('\n--- Iniciando carga de datos de ejemplo ---\n');

  const categoriaIds = await seedCategorias(db);
  await seedUsuarios(db);

  await seedProductos(db, categoriaIds);

  const productos = await db.collection('productos').find().toArray();
  const usuarios = await db.collection('usuarios').find().toArray();
  await seedMovimientos(db, productos, usuarios);

  console.log('\n--- Carga completa ---\n');

  for (const nombre of ['categorias', 'usuarios', 'productos', 'movimientos']) {
    const cantidad = await db.collection(nombre).countDocuments();
    console.log(`${nombre}: ${cantidad} documentos`);
  }
}

seedAll()
  .catch((err) => console.error('Error durante el seed:', err))
  .finally(() => closeConnection());
