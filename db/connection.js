// db/connection.js
//
// Módulo único de conexión a MongoDB. Todos los scripts (seeds y queries)
// importan getDb() desde acá en lugar de abrir su propia conexión, para no
// duplicar código de conexión en cada archivo.
//
// Uso:
//   const { getDb, closeConnection } = require('../../db/connection');
//   const db = await getDb();
//   ... trabajar con db.collection('productos') ...
//   await closeConnection();

const { MongoClient } = require('mongodb');

// Cadena de conexión a Mongo local. Si más adelante migran a Atlas, alcanza
// con cambiar esta URI (o, mejor, leerla desde una variable de entorno).
const URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGO_DB_NAME || 'inventario';

let client;
let db;

/**
 * Devuelve una conexión activa a la base 'inventario'. Si ya hay una
 * conexión abierta, la reutiliza (evita abrir múltiples conexiones cuando
 * varias partes del código llaman a getDb() en la misma ejecución).
 */
async function getDb() {
  if (db) return db;

  client = new MongoClient(URI);
  await client.connect();
  db = client.db(DB_NAME);

  console.log(`Conectado a MongoDB -> base "${DB_NAME}" (${URI})`);
  return db;
}

/**
 * Cierra la conexión. Hay que llamarla al final de cada script para que
 * el proceso de Node termine solo (si no, queda colgado esperando).
 */
async function closeConnection() {
  if (client) {
    await client.close();
    db = undefined;
  }
}

module.exports = { getDb, closeConnection };