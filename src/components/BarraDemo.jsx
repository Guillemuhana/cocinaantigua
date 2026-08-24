import { Link } from 'react-router-dom'

/* ===========================================================================
   Barra de demostración.

   Son dos productos distintos con dos públicos distintos:

     · la tienda  → la ve cualquiera que entre desde Instagram
     · el sistema → lo ve sólo el equipo, con la plata y los sueldos a la vista

   En la vida real ni siquiera comparten dominio, y desde la tienda no hay
   forma de llegar al sistema. Acá conviven para poder mostrarlos en una
   reunión, así que el puente entre los dos vive en esta barra: negra, arriba
   de todo y con la palabra "demostración" escrita. Queda claro que es el
   andamio y no el producto — y cuando esto salga a producción, se borra este
   componente y no queda ningún rastro en las dos pantallas.
   =========================================================================== */

export default function BarraDemo({ lado }) {
  const enTienda = lado === 'tienda'

  return (
    <div className="bg-tinta text-papel">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] shrink-0">
          <span className="punto punto-vivo text-damasco" />
          Demostración
        </span>

        <span className="text-sm text-papel/70 min-w-0">
          {enTienda
            ? 'Estás viendo la tienda, tal como la ve un cliente.'
            : 'Estás viendo el sistema interno, que usa sólo el equipo.'}
        </span>

        <Link
          to={enTienda ? '/' : '/tienda'}
          className="ml-auto shrink-0 text-sm font-semibold underline underline-offset-4 decoration-papel/40 hover:decoration-papel"
        >
          {enTienda ? 'Ver el sistema interno →' : 'Ver la tienda pública →'}
        </Link>
      </div>
    </div>
  )
}
