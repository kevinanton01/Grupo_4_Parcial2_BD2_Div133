// scripts/queries/queries.js
//
// Ejecuta, en un solo script, los 4 aggregation pipelines del MVP.

const { getDb, closeConnection } = require('../db/connection');

async function stockValorizadoPorCategoria(db) {
  const pipeline = [
    { $lookup: { from: 'categorias', localField: 'categoriaId', foreignField: '_id', as: 'categoria' } },
    { $unwind: '$categoria' },
    {
      $group: {
        _id: '$categoria.nombre',
        cantidadProductos: { $sum: 1 },
        unidadesEnStock: { $sum: '$stock' },
        valorTotal: { $sum: { $multiply: ['$precio', '$stock'] } },
      },
    },
    { $sort: { valorTotal: -1 } },
    { $project: { _id: 0, categoria: '$_id', cantidadProductos: 1, unidadesEnStock: 1, valorTotal: 1 } },
  ];
  return db.collection('productos').aggregate(pipeline).toArray();
}

async function historialMovimientosProducto(db, sku) {
  const pipeline = [
    { $lookup: { from: 'productos', localField: 'productoId', foreignField: '_id', as: 'producto' } },
    { $unwind: '$producto' },
    { $match: { 'producto.sku': sku } },
    { $sort: { fecha: -1 } },
    {
      $project: {
        _id: 0, producto: '$producto.nombre', sku: '$producto.sku',
        tipo: 1, cantidad: 1, fecha: 1, motivo: 1, registradoPor: '$usuario.nombre',
      },
    },
  ];
  return db.collection('movimientos').aggregate(pipeline).toArray();
}

async function rankingProductosMasVendidos(db, top = 5) {
  const pipeline = [
    { $match: { tipo: 'salida' } },
    { $group: { _id: '$productoId', totalVendido: { $sum: '$cantidad' }, cantidadMovimientos: { $sum: 1 } } },
    { $sort: { totalVendido: -1 } },
    { $limit: top },
    { $lookup: { from: 'productos', localField: '_id', foreignField: '_id', as: 'producto' } },
    { $unwind: '$producto' },
    { $project: { _id: 0, producto: '$producto.nombre', sku: '$producto.sku', totalVendido: 1, cantidadMovimientos: 1 } },
  ];
  return db.collection('movimientos').aggregate(pipeline).toArray();
}

async function productosBajoStock(db, umbral = 10) {
  const pipeline = [
    { $match: { activo: true, stock: { $lt: umbral } } },
    { $lookup: { from: 'categorias', localField: 'categoriaId', foreignField: '_id', as: 'categoria' } },
    { $unwind: '$categoria' },
    { $sort: { stock: 1 } },
    { $project: { _id: 0, producto: '$nombre', sku: 1, stock: 1, categoria: '$categoria.nombre' } },
  ];
  return db.collection('productos').aggregate(pipeline).toArray();
}

async function main() {
  const db = await getDb();

  console.log('\n=== 1) Stock valorizado por categoría ===');
  console.table(await stockValorizadoPorCategoria(db));

  console.log('\n=== 2) Historial de movimientos: Mouse inalámbrico (TEC-001) ===');
  console.table(await historialMovimientosProducto(db, 'TEC-001'));

  console.log('\n=== 3) Top 5 productos más vendidos ===');
  console.table(await rankingProductosMasVendidos(db, 5));

  console.log('\n=== 4) Productos con stock bajo (< 10 unidades) ===');
  console.table(await productosBajoStock(db, 10));
}

main()
  .catch((err) => console.error('Error ejecutando las queries:', err))
  .finally(() => closeConnection());