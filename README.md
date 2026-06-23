# Inventario MVP — MongoDB

MVP de un sistema de inventario para una oficina o negocio chico. Permite
registrar productos, categorías, movimientos de stock (entradas/salidas) y
usuarios que operan el sistema, y ejecutar consultas agregadas reales sobre
esos datos usando el Aggregation Pipeline de MongoDB.

> Trabajo práctico — Parcial 2, Bases de Datos II, UTN Avellaneda (2026).
> Grupo:  _4_.
> Integrantes: Kevin Antón - Perez Jonathan - Gabriel Pabon - Micael Frete - Nicolas Peralta.

---

## Qué hace el programa

El programa simula el manejo de inventario de un negocio chico (por ejemplo,
una oficina que vende y consume insumos, tecnología, limpieza y mobiliario).
Concretamente:

- Se conecta a una base MongoDB real (local, `mongodb://localhost:27017`).
- Carga datos de ejemplo en **4 colecciones relacionadas entre sí**:
  `categorias`, `usuarios`, `productos` y `movimientos`.
- Ejecuta **4 aggregation pipelines** que responden preguntas reales de
  negocio sobre esos datos:
  1. Stock valorizado por categoría (cuánto dinero hay invertido en cada
     rubro del inventario).
  2. Historial de movimientos de un producto puntual (entradas y salidas,
     ordenadas por fecha, con quién las registró).
  3. Ranking de los productos más vendidos (top 5 por cantidad de
     salidas).
  4. Alerta de productos con stock bajo (para saber qué reponer).

No es una app con interfaz gráfica: es un programa de consola (CLI) pensado
para demostrar conexión real a MongoDB, un modelo de datos relacionado entre
colecciones, y el uso del Aggregation Pipeline

## Cómo ejecutarlo

### 1. Requisitos

- Node.js (v18 o superior).
- MongoDB corriendo localmente (`mongod` levantado o el servicio de
  MongoDB activo) en `mongodb://localhost:27017`.

### 2. Clonar el repositorio e instalar dependencias

```bash
git clone https://github.com/kevinanton01/Grupo_4_Parcial2_BD2_Div133.git
cd Grupo_4_Parcial2_BD2_Div133
npm install
```

`npm install` lee el `package.json` y descarga el driver oficial de
MongoDB para Node (`mongodb`), que es la única dependencia del proyecto.

### 3. Cargar los datos de ejemplo (seed)

```bash
npm run seed
```

Esto se conecta a la base `inventario`, **vacía** las 4 colecciones
(`deleteMany({})`) y las vuelve a poblar con datos de prueba, en este
orden (porque hay dependencias entre ellas — ver más abajo):

1. `categorias`
2. `usuarios`
3. `productos` (necesita los `_id` de `categorias`)
4. `movimientos` (necesita los `_id` de `productos` y los datos de
   `usuarios`)

Es seguro correrlo varias veces: cada corrida deja la base en el mismo
estado conocido.

### 4. Ejecutar las consultas (aggregation pipelines)

```bash
npm run queries
```

Esto corre los 4 pipelines en secuencia y muestra cada resultado en
consola con `console.table()`, junto con un encabezado que indica qué
pregunta de negocio responde cada uno.

## Estructura del proyecto

```
parcial2/
├── db/
│   └── connection.js                       # módulo único de conexión a MongoDB
├── scripts/
│   ├── data_files/                         # scripts de carga de datos de ejemplo (seed)
│   │   ├── data-categorias.js
│   │   ├── data-usuarios.js
│   │   ├── data-productos.js
│   │   ├── data-movimientos.js
│   │   └── 00-seed-all.js                   # orquestador: corre todo en el orden correcto
│   └── queries/
│       └── queries.js                       # los 4 aggregation pipelines en un solo script
├── docs/                                    # Imagen del diagrama DER y PDF del trabajo
│   └── Diagrama.png                         
|   └── Grupo_4_Parcial2_BD2_Div133.pdf 
├── package.json
└── README.md
```

## Descripción de las colecciones y estructura del modelo

| Colección | Qué guarda | Cómo se relaciona |
|---|---|---|
| `categorias` | Categorías de productos: `nombre`, `descripcion`. | Es referenciada desde `productos` (`categoriaId`). |
| `usuarios` | Personas que operan el sistema: `nombre`, `rol`, `email`. | No se referencia directamente: se **embebe un snapshot** (`nombre`, `rol`) dentro de cada `movimiento`. |
| `productos` | Catálogo: `nombre`, `sku`, `precio`, `stock`, `unidad`, `activo`. | Referencia a `categorias` vía `categoriaId`. Es referenciado desde `movimientos` vía `productoId`. |
| `movimientos` | Entradas/salidas de stock: `tipo`, `cantidad`, `fecha`, `motivo`. | Referencia a `productos` vía `productoId`. Embebe un snapshot de `usuarios` en el campo `usuario`. |

Esquema simplificado de cada documento:

```js
// categorias
{ _id, nombre, descripcion }

// usuarios
{ _id, nombre, rol, email }

// productos
{ _id, nombre, sku, precio, stock, unidad, categoriaId, activo }

// movimientos
{
  _id, productoId, tipo, cantidad, fecha, motivo,
  usuario: { nombre, rol }   // <- embebido, no referenciado
}
```

## Justificación de las decisiones de diseño

> Resumen rápido acá; el detalle completo (con las preguntas guía de la
> Parte 2 del parcial: qué entidades hay, dónde se embebió y por qué, qué
> pasaría con un modelo relacional) está en [`docs/Grupo_4_Parcial2_BD2_Div133.pdf`](./docs/Grupo_4_Parcial2_BD2_Div133.pdf).

- **`productos → categorias` es referencing**, no embedding. Una
  categoría se comparte entre muchos productos; si la embebiéramos
  dentro de cada producto, el mismo dato (`nombre`, `descripcion` de la
  categoría) quedaría duplicado en cada uno, y actualizarlo implicaría
  tocar todos los productos de esa categoría a la vez.

- **`movimientos → productos` es referencing**. Un producto tiene un solo
  registro de stock/precio actual, pero puede tener decenas de
  movimientos a lo largo del tiempo: ese lado "muchos" no tiene un tope
  fijo, así que la referencia va del lado del hijo (`movimientos`),
  nunca como array creciente dentro de `productos`.

- **`movimientos → usuarios` es embedding** (un caso particular, no el
  "default"). Un movimiento es un registro histórico: si mañana Bruno
  cambia de rol o deja de trabajar en el negocio, el movimiento de stock
  de hace tres meses tiene que seguir mostrando quién lo hizo *en ese
  momento*, no el estado actual de ese usuario. Por eso se guarda una
  copia (`{ nombre, rol }`) en lugar de solo una referencia.

## Aggregation pipelines incluidos

| # | Pipeline | Etapas principales | Pregunta que responde |
|---|---|---|---|
| 1 | Stock valorizado por categoría | `$lookup`, `$unwind`, `$group`, `$sort`, `$project` | ¿Cuánto dinero hay invertido en cada categoría de productos? |
| 2 | Historial de movimientos de un producto | `$lookup`, `$unwind`, `$match`, `$sort`, `$project` | ¿Qué entradas/salidas tuvo un producto puntual, y quién las registró? |
| 3 | Ranking de productos más vendidos | `$match`, `$group`, `$sort`, `$limit`, `$lookup`, `$unwind`, `$project` | ¿Cuáles son los 5 productos con más unidades vendidas? |
| 4 | Productos con stock bajo | `$match`, `$lookup`, `$unwind`, `$sort`, `$project` | ¿Qué productos activos están por debajo del umbral de reposición? |
