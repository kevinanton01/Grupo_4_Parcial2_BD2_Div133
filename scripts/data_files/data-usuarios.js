// scripts/seed/data-usuarios.js
//
// Carga la colección 'usuarios'. Tampoco depende de otra colección.
// Estos usuarios después se "embeben" como snapshot dentro de cada
// movimiento de stock (ver data-movimientos.js).

const { getDb, closeConnection } = require('../../db/connection');

const usuarios = [
  { nombre: 'Ana López', rol: 'admin', email: 'ana@negocio.com' },
  { nombre: 'Bruno Pérez', rol: 'empleado', email: 'bruno@negocio.com' },
  { nombre: 'Carla Gómez', rol: 'empleado', email: 'carla@negocio.com' },
];

async function seedUsuarios(db) {
  const coleccion = db.collection('usuarios');

  await coleccion.deleteMany({});
  const resultado = await coleccion.insertMany(usuarios);

  console.log('=== USUARIOS ===');
  console.log(`Insertados: ${resultado.insertedCount}`);

  return Object.values(resultado.insertedIds);
}

if (require.main === module) {
  (async () => {
    const db = await getDb();
    await seedUsuarios(db);
    await closeConnection();
  })();
}

module.exports = { seedUsuarios, usuarios };