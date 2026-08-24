# Cocina Antigua — sistema de ferias y tienda

Demostración funcional del sistema de gestión de eventos y la tienda online.
Arranca con datos de ejemplo cargados: no hace falta configurar nada para verlo andar.

---

## Cómo correrlo

Necesitás Node 18 o superior.

```bash
npm install
npm run dev
```

Se abre solo en `http://localhost:5173`.

En VS Code: `Archivo → Abrir carpeta` sobre esta carpeta, después abrí una terminal
integrada (`Ctrl + ñ`) y corré los dos comandos de arriba.

---

## Guion para mostrarle al cliente

El recorrido dura unos cinco minutos y cuenta la historia completa.

**1. Panel.** Dos ferias abiertas al mismo tiempo, cada una con su propio resultado.
Abajo, la comparación entre ferias y tienda: la pregunta que se hacen todos los años.

**2. Fiesta del Poncho → solapa Stock.** Acá se ve la ecuación que tiene que cerrar:
llevaron 180 frascos de higo, vendieron 67, se fueron 8 entre roturas y degustaciones,
quedan 105. Las dos unidades que se rompieron en el viaje quedan registradas como tales,
no desaparecidas.

**3. Solapa Caja.** El arqueo del viernes cierra con $2.500 de diferencia. Eso es lo que
hoy no se detecta hasta que es tarde. Fijate que el posnet muestra bruto y neto por
separado, porque la comisión se la lleva la tarjeta.

**4. Abrir punto de venta.** La pantalla es oscura a propósito: se usa afuera, al sol,
y el vendedor ya está acostumbrado a leer los precios de un pizarrón. Cargá dos frascos,
tocá Cobrar y dividí el pago: $10.000 en efectivo y el resto por posnet. Es lo que pasa
todo el tiempo en una feria y ningún sistema genérico lo contempla.

También está el botón para registrar una rotura o una degustación sin salir de la pantalla.

**5. Depósito.** El punto que más plata les ahorra. Hay 900 frascos de higo, pero la web
solo puede vender 310: el resto está apartado para Mendoza, reservado por pedidos sin
pagar, o protegido por el colchón que se dejó para las ferias.

**6. Ver la tienda.** El catálogo público. Agregá algo al carrito y confirmá un pedido.

**7. Pedidos web.** El pedido que acabás de hacer aparece en la bandeja, esperando pago.
El stock todavía no se descontó: está reservado 48 horas. Recién cuando se marca como
pagado, el frasco sale del depósito.

---

## Qué es real y qué es de mentira

**Real:** toda la lógica. Conciliación de stock, arqueo de caja, comisiones del posnet,
liquidación del personal por jornal o comisión, reservas de la tienda, márgenes por evento
y por canal. Los cálculos de `src/lib/store.jsx` replican una por una las vistas del
esquema SQL.

**De ejemplo:** los datos (`src/lib/demoData.js`) y las fotos de producto, que por ahora
son un frasco dibujado con el color de cada sabor. Nada se guarda: al recargar la página
vuelve al estado inicial.

---

## Estructura

```
src/
  lib/
    demoData.js     Datos de ejemplo. Se borra cuando se conecta la base.
    store.jsx       Estado y cálculos. Cada selector replica una vista SQL.
    format.js       Formato de moneda, fechas y etiquetas en español.
    supabase.js     Cliente real, listo para cuando se conecte.
  components/       Layout y piezas de interfaz compartidas.
  pages/
    Panel.jsx           Resumen de la operación
    Eventos.jsx         Listado de ferias
    EventoDetalle.jsx   Stock, caja, gastos y equipo de una feria
    PuntoVenta.jsx      La pantalla del stand
    Deposito.jsx        Stock central y disponible para la web
    Pedidos.jsx         Bandeja de pedidos online
    Tienda.jsx          Tienda pública
supabase/migrations/
  01_schema_eventos.sql   Eventos, stock, ventas, caja, gastos, personal
  02_schema_tienda.sql    Catálogo público, pedidos, envíos, reservas
```

---

## Pasar de demostración a sistema real

1. Crear un proyecto en Supabase.
2. Correr las dos migraciones en orden en el SQL Editor.
3. Copiar `.env.example` a `.env` y completar la URL y la clave anónima.
4. Reemplazar los selectores de `store.jsx` por consultas a las vistas del esquema.
   Los nombres coinciden a propósito: `stockEvento` → `v_stock_evento`,
   `arqueo` → `v_arqueo_jornada`, `stockWeb` → `v_stock_web`, y así.

Dos cosas que hay que resolver antes de salir a producción con la tienda:

- El cambio de un pedido a "pagado" tiene que hacerlo una Edge Function con `service_role`
  escuchando el webhook de Mercado Pago, nunca el navegador. Si el frontend puede marcar un
  pedido como pagado, cualquiera se manda mercadería gratis.
- Vender al público por internet trae obligaciones que la venta en feria disimula: factura
  al consumidor final, botón de arrepentimiento y datos de contacto por Defensa del
  Consumidor. Conviene hablarlo con el contador antes de publicar.

---

## Tecnología

React 19 · Vite 6 · Tailwind CSS 4 · Supabase (PostgreSQL con Row Level Security)
