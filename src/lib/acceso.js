/* ===========================================================================
   Modo mantenimiento.

   Mientras el trabajo no esté aprobado, la app no se muestra: cualquiera que
   entre por cualquier ruta ve la pantalla de mantenimiento y nada más. El
   código de la app queda en un chunk aparte que ni siquiera se descarga.

   La única puerta es un link con la clave:

       https://cocinaantigua.vercel.app/?acceso=higo-2026

   Al entrar con la clave queda guardada en el navegador, así que después se
   navega normal, sin arrastrar el parámetro en la URL — y se puede mostrar la
   app en una reunión sin que la clave quede a la vista en la barra de
   direcciones ni en una captura de pantalla.

       ?acceso=salir   cierra la sesión y vuelve a tapar la app.

   Es un candado de cortesía, no una caja fuerte: la clave viaja en el
   JavaScript del navegador y alguien que sepa mirar el código la encuentra.
   Alcanza para que la app no quede abierta al público mientras se define el
   trabajo; si hiciera falta algo más firme, va del lado del servidor.

   Para volver a abrir la app: poner MANTENIMIENTO en false acá abajo y
   publicar. O, sin tocar el código, un env var VITE_MANTENIMIENTO=false en
   Vercel.
   =========================================================================== */

export const MANTENIMIENTO = import.meta.env.VITE_MANTENIMIENTO !== 'false'

/* Cambiala cuando quieras invalidar los links que ya repartiste. */
const CLAVE = 'higo-2026'

const CAJON = 'ca-acceso'

/* localStorage tira excepción en modo incógnito de algunos navegadores y
   cuando el usuario bloquea el almacenamiento del sitio. Que eso no rompa
   la pantalla: sin memoria, el link con la clave sigue funcionando. */
function recordar(valor) {
  try {
    if (valor === null) localStorage.removeItem(CAJON)
    else localStorage.setItem(CAJON, valor)
  } catch { /* sin memoria, seguimos */ }
}

function recordado() {
  try { return localStorage.getItem(CAJON) } catch { return null }
}

/* Saca ?acceso=... de la URL sin recargar, para no dejar la clave escrita
   en la barra de direcciones. */
function limpiarUrl() {
  const url = new URL(window.location.href)
  url.searchParams.delete('acceso')
  window.history.replaceState({}, '', url.pathname + url.search + url.hash)
}

export function tieneAcceso() {
  if (!MANTENIMIENTO) return true

  const pedido = new URLSearchParams(window.location.search).get('acceso')

  if (pedido === 'salir') {
    recordar(null)
    limpiarUrl()
    return false
  }

  if (pedido !== null) {
    const bien = pedido === CLAVE
    if (bien) recordar(CLAVE)
    limpiarUrl()
    return bien
  }

  return recordado() === CLAVE
}
