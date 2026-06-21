// scripts/seed/data-movimientos.js
//
// Carga la colección 'movimientos' (entradas y salidas de stock).
// productoId -> REFERENCIA a productos.
// usuario     -> EMBEBIDO como snapshot { nombre, rol } (registro histórico).

const { getDb, closeConnection } = require('../../db/connection');

function buildMovimientos(productos, usuarios) {
  const porSku = (sku) => productos.find((p) => p.sku === sku);
  const [ana, bruno, carla] = usuarios;
  const snapshot = (u) => ({ nombre: u.nombre, rol: u.rol });

  return [
    { productoId: porSku('TEC-001')._id, tipo: 'entrada', cantidad: 50,  fecha: new Date(2026, 4, 2),  usuario: snapshot(ana),   motivo: 'compra a proveedor' },
    { productoId: porSku('TEC-001')._id, tipo: 'salida',  cantidad: 16,  fecha: new Date(2026, 4, 10), usuario: snapshot(bruno), motivo: 'venta' },
    { productoId: porSku('TEC-002')._id, tipo: 'entrada', cantidad: 20,  fecha: new Date(2026, 4, 3),  usuario: snapshot(ana),   motivo: 'compra a proveedor' },
    { productoId: porSku('TEC-002')._id, tipo: 'salida',  cantidad: 2,   fecha: new Date(2026, 4, 15), usuario: snapshot(carla), motivo: 'venta' },
    { productoId: porSku('TEC-003')._id, tipo: 'entrada', cantidad: 10,  fecha: new Date(2026, 4, 1),  usuario: snapshot(ana),   motivo: 'compra a proveedor' },
    { productoId: porSku('TEC-003')._id, tipo: 'salida',  cantidad: 7,   fecha: new Date(2026, 4, 20), usuario: snapshot(bruno), motivo: 'venta' },
    { productoId: porSku('INS-001')._id, tipo: 'entrada', cantidad: 100, fecha: new Date(2026, 4, 5),  usuario: snapshot(ana),   motivo: 'compra a proveedor' },
    { productoId: porSku('INS-001')._id, tipo: 'salida',  cantidad: 20,  fecha: new Date(2026, 4, 18), usuario: snapshot(carla), motivo: 'venta' },
    { productoId: porSku('INS-003')._id, tipo: 'salida',  cantidad: 12,  fecha: new Date(2026, 4, 22), usuario: snapshot(bruno), motivo: 'venta' },
    { productoId: porSku('LIM-001')._id, tipo: 'entrada', cantidad: 80,  fecha: new Date(2026, 4, 4),  usuario: snapshot(carla), motivo: 'compra a proveedor' },
    { productoId: porSku('LIM-001')._id, tipo: 'salida',  cantidad: 20,  fecha: new Date(2026, 4, 25), usuario: snapshot(ana),   motivo: 'consumo interno' },
    { productoId: porSku('MOB-002')._id, tipo: 'salida',  cantidad: 1,   fecha: new Date(2026, 4, 12), usuario: snapshot(bruno), motivo: 'venta' },
  ];
}

async function seedMovimientos(db, productos, usuarios) {
  const coleccion = db.collection('movimientos');
  const movimientos = buildMovimientos(productos, usuarios);

  await coleccion.deleteMany({});
  const resultado = await coleccion.insertMany(movimientos);

  console.log('=== MOVIMIENTOS ===');
  console.log(`Insertados: ${resultado.insertedCount}`);

  return Object.values(resultado.insertedIds);
}

if (require.main === module) {
  (async () => {
    const db = await getDb();
    const productos = await db.collection('productos').find().toArray();
    const usuarios = await db.collection('usuarios').find().toArray();

    if (productos.length === 0 || usuarios.length === 0) {
      console.log('Faltan productos o usuarios cargados. Corré primero el seed completo (npm run seed).');
    } else {
      await seedMovimientos(db, productos, usuarios);
    }
    await closeConnection();
  })();
}

module.exports = { seedMovimientos, buildMovimientos };