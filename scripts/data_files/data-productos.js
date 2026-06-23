// Carga la colección 'productos'. Depende de que 'categorias' ya esté
// cargada: cada producto referencia su categoría por _id (categoriaId).

const { getDb, closeConnection } = require('../../db/connection');

function buildProductos(categoriaIds) {
  const [insumos, tecnologia, limpieza, mobiliario] = categoriaIds;

  return [
    { nombre: 'Resma A4 75g',         sku: 'INS-001', precio: 4200,  stock: 80, unidad: 'paquete', categoriaId: insumos,    activo: true },
    { nombre: 'Lapicera azul x12',    sku: 'INS-002', precio: 3500,  stock: 40, unidad: 'caja',     categoriaId: insumos,    activo: true },
    { nombre: 'Carpeta A4',           sku: 'INS-003', precio: 1800,  stock: 5,  unidad: 'unidad',   categoriaId: insumos,    activo: true },
    { nombre: 'Mouse inalámbrico',    sku: 'TEC-001', precio: 8500,  stock: 34, unidad: 'unidad',   categoriaId: tecnologia, activo: true },
    { nombre: 'Teclado USB',          sku: 'TEC-002', precio: 12000, stock: 18, unidad: 'unidad',   categoriaId: tecnologia, activo: true },
    { nombre: 'Cable HDMI 2m',        sku: 'TEC-003', precio: 4500,  stock: 3,  unidad: 'unidad',   categoriaId: tecnologia, activo: true },
    { nombre: 'Alcohol en gel 500ml', sku: 'LIM-001', precio: 2100,  stock: 60, unidad: 'unidad',   categoriaId: limpieza,   activo: true },
    { nombre: 'Detergente 750ml',     sku: 'LIM-002', precio: 1900,  stock: 25, unidad: 'unidad',   categoriaId: limpieza,   activo: true },
    { nombre: 'Silla de escritorio',  sku: 'MOB-001', precio: 65000, stock: 7,  unidad: 'unidad',   categoriaId: mobiliario, activo: true },
    { nombre: 'Escritorio 120cm',     sku: 'MOB-002', precio: 95000, stock: 2,  unidad: 'unidad',   categoriaId: mobiliario, activo: true },
  ];
}

async function seedProductos(db, categoriaIds) {
  const coleccion = db.collection('productos');
  const productos = buildProductos(categoriaIds);

  await coleccion.deleteMany({});
  const resultado = await coleccion.insertMany(productos);

  console.log('=== PRODUCTOS ===');
  console.log(`Insertados: ${resultado.insertedCount}`);

  return Object.values(resultado.insertedIds);
}

if (require.main === module) {
  (async () => {
    const db = await getDb();
    const categoriasExistentes = await db.collection('categorias').find().toArray();

    if (categoriasExistentes.length === 0) {
      console.log('No hay categorías cargadas. Corré primero data-categorias.js (o npm run seed).');
    } else {
      const ids = categoriasExistentes.map((c) => c._id);
      await seedProductos(db, ids);
    }
    await closeConnection();
  })();
}

module.exports = { seedProductos, buildProductos };
