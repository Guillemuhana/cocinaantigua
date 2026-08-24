import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { money, num, rango } from '../lib/format'
import { Placa, Hoja, Dato, Chip, Barra } from '../components/ui'

export default function Panel() {
  const { eventos, resultadoEvento, arqueo, jornadas, stockWeb, pedidos, resultadoCanal } = useStore()

  const activos = eventos.filter(e => e.estado === 'abierto')
  const canales = resultadoCanal()
  const totalCanal = canales.reduce((a, c) => a + c.bruto, 0)
  const web = stockWeb()
  const sinStockWeb = web.filter(w => w.producto.visibleWeb && w.disponible === 0)
  const pedidosAbiertos = pedidos.filter(p => ['pendiente_pago', 'pagado', 'en_preparacion'].includes(p.estado))

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Placa sub="Lunes 24 de agosto de 2026">Dos ferias en curso</Placa>
        <Link to="/eventos" className="eyebrow text-higo hover:underline underline-offset-4">Ver todos los eventos →</Link>
      </div>

      {/* Eventos abiertos: lo que está pasando ahora mismo */}
      <section className="grid gap-4 md:grid-cols-2">
        {activos.map(e => {
          const r = resultadoEvento(e.id)
          const j = jornadas.find(x => x.eventoId === e.id && x.estado === 'abierta')
          return (
            <Hoja key={e.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow text-tinta-50">{e.provincia}</p>
                  <h2 className="font-display text-xl mt-1 leading-snug">
                    <Link to={`/eventos/${e.id}`} className="hover:text-higo">{e.nombre}</Link>
                  </h2>
                  <p className="text-xs text-tinta-50 mt-1">{rango(e.desde, e.hasta)}</p>
                </div>
                <Chip tono={e.modoCarga === 'detallada' ? 'marca' : 'neutro'}>
                  {e.modoCarga === 'detallada' ? 'Ticket por ticket' : 'Cierre por jornada'}
                </Chip>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-tinta/10">
                <Dato etiqueta="Vendido" valor={money(r.bruto)} />
                <Dato etiqueta="Frascos" valor={num(r.unidades)} />
                <Dato etiqueta="Margen" valor={money(r.margen)} tono={r.margen >= 0 ? 'bien' : 'mal'} />
              </div>

              <div className="flex flex-wrap gap-2 mt-5">
                {j && (
                  <Link to={`/venta/${e.id}`}
                    className="btn bg-damasco text-tinta px-4 py-2.5 rounded-sm text-sm">
                    Abrir punto de venta
                  </Link>
                )}
                <Link to={`/eventos/${e.id}`}
                  className="btn border border-tinta/20 px-4 py-2.5 rounded-sm text-sm hover:bg-papel-2">
                  Ver el evento
                </Link>
              </div>
            </Hoja>
          )
        })}
      </section>

      {/* Comparación de canales: la pregunta que el dueño se hace todo el año */}
      <section>
        <h2 className="font-display text-lg mb-1">¿Dónde se vende mejor?</h2>
        <p className="text-sm text-tinta-50 mb-4 max-w-prose">
          Ferias y tienda descuentan del mismo depósito, así que se pueden comparar con el mismo criterio.
        </p>
        <Hoja className="p-5 space-y-5">
          {canales.map(c => (
            <div key={c.canal}>
              <div className="flex items-baseline justify-between gap-4 mb-2">
                <span className="font-medium">{c.canal}</span>
                <span className="cifra text-sm text-tinta-50">
                  {num(c.operaciones)} operaciones · margen {money(c.margenBruto)}
                </span>
              </div>
              <Barra valor={c.bruto} total={totalCanal}
                     color={c.canal === 'Ferias' ? 'var(--color-higo)' : 'var(--color-damasco)'} />
              <p className="cifra text-sm mt-1.5">{money(c.bruto)}</p>
            </div>
          ))}
        </Hoja>
      </section>

      {/* Lo que necesita atención hoy */}
      <section className="grid gap-4 md:grid-cols-2">
        <Hoja className="p-5">
          <p className="eyebrow text-tinta-50">Caja sin cerrar</p>
          {jornadas.filter(j => j.estado === 'abierta').map(j => {
            const a = arqueo(j.id)
            const ev = eventos.find(e => e.id === j.eventoId)
            return (
              <div key={j.id} className="mt-3 flex items-baseline justify-between gap-3">
                <Link to={`/eventos/${j.eventoId}`} className="text-sm hover:text-higo">{ev?.nombre}</Link>
                <span className="cifra text-sm">{money(a.esperado)} esperados</span>
              </div>
            )
          })}
        </Hoja>

        <Hoja className="p-5">
          <p className="eyebrow text-tinta-50">Pendiente en la tienda</p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Pedidos por preparar</span>
              <span className="cifra">{pedidosAbiertos.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Sabores agotados en la web</span>
              <span className={`cifra ${sinStockWeb.length ? 'text-membrillo' : ''}`}>{sinStockWeb.length}</span>
            </div>
          </div>
          {sinStockWeb.length > 0 && (
            <p className="text-xs text-tinta-50 mt-3 leading-relaxed">
              {sinStockWeb.map(w => w.producto.sabor).join(', ')} — sin unidades libres después de
              apartar lo de las ferias.
            </p>
          )}
        </Hoja>
      </section>
    </div>
  )
}
