import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { money, num, rango, fechaLarga } from '../lib/format'
import { Hoja, Dato, Chip, Barra, Estado } from '../components/ui'

/* ===========================================================================
   Panel de inicio.

   Ordenado por urgencia, no por tema: primero cómo viene el año, después lo
   que hay que resolver hoy, y recién ahí el detalle. El dueño entra acá entre
   cliente y cliente, así que lo accionable va arriba de todo.
   =========================================================================== */

export default function Panel() {
  const { eventos, resultadoEvento, arqueo, jornadas, stockWeb, pedidos, resultadoCanal } = useStore()

  const abiertas = eventos.filter(e => e.estado === 'abierto')
  const canales = resultadoCanal()
  const ferias = canales[0]
  const web = canales[1]
  const totalVendido = canales.reduce((a, c) => a + c.bruto, 0)
  const totalFrascos = canales.reduce((a, c) => a + c.unidades, 0)

  // Las ferias ya descuentan sueldos, canon y gastos; la web todavía no tiene
  // gastos de estructura cargados. Se aclara debajo del número.
  const gananciaFerias = eventos.reduce((a, e) => a + resultadoEvento(e.id).margen, 0)
  const ganancia = gananciaFerias + web.margenBruto

  /* --- Lo que está frenado esperando que alguien haga algo -------------- */
  const porPreparar = pedidos.filter(p => ['pagado', 'en_preparacion'].includes(p.estado))
  const esperandoPago = pedidos.filter(p => p.estado === 'pendiente_pago')
  const cajasAbiertas = jornadas.filter(j => j.estado === 'abierta')
  const agotados = stockWeb().filter(w => w.producto.visibleWeb && w.disponible === 0)

  const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`

  const pendientes = [
    porPreparar.length && {
      texto: plural(porPreparar.length, 'pedido pago sin preparar', 'pedidos pagos sin preparar'),
      detalle: 'Ya está cobrado. Falta armar el paquete y despacharlo.',
      a: '/pedidos',
      tono: 'mal',
    },
    cajasAbiertas.length && {
      texto: plural(cajasAbiertas.length, 'caja sin cerrar', 'cajas sin cerrar'),
      detalle: cajasAbiertas
        .map(j => `${eventos.find(e => e.id === j.eventoId)?.nombre}: tendría que haber ${money(arqueo(j.id).esperado)} en efectivo`)
        .join(' · '),
      a: `/eventos/${cajasAbiertas[0].eventoId}`,
      tono: 'aviso',
    },
    agotados.length && {
      texto: plural(agotados.length, 'sabor agotado en la web', 'sabores agotados en la web'),
      detalle: `${agotados.map(w => w.producto.sabor).join(', ')} — no quedan frascos libres después de apartar los de las ferias.`,
      a: '/deposito',
      tono: 'aviso',
    },
    esperandoPago.length && {
      texto: plural(esperandoPago.length, 'pedido esperando el pago', 'pedidos esperando el pago'),
      detalle: 'Tienen la mercadería reservada por 48 horas.',
      a: '/pedidos',
      tono: 'neutro',
    },
  ].filter(Boolean)

  const colorPunto = { mal: 'text-membrillo', aviso: 'text-damasco', neutro: 'text-tinta-50' }

  return (
    <div className="space-y-14">

      {/* 1 · Cómo viene el negocio, en tres números */}
      <section className="entra">
        <p className="text-sm text-tinta-50">{fechaLarga()}</p>
        <h1 className="display-2 mt-1.5">Así viene el año</h1>

        <Hoja className="mt-6 p-6 sm:p-8 grid gap-8 sm:grid-cols-3">
          <Dato
            etiqueta="Vendido"
            valor={money(totalVendido)}
            destacado
            detalle="Ferias y tienda online sumadas"
          />
          <Dato
            etiqueta="Frascos vendidos"
            valor={num(totalFrascos)}
            destacado
            detalle={`${num(ferias.operaciones)} ventas en feria y ${num(web.operaciones)} pedidos web`}
          />
          <Dato
            etiqueta="Ganancia"
            valor={money(ganancia)}
            destacado
            tono={ganancia >= 0 ? 'bien' : 'mal'}
            detalle="Ya descontados los frascos, los sueldos, el canon y los gastos"
          />
        </Hoja>
      </section>

      {/* 2 · Lo que no puede esperar */}
      <section className="entra">
        <div className="flex items-baseline justify-between gap-4 mb-1">
          <h2 className="text-xl">Para resolver hoy</h2>
          {pendientes.length > 0 && (
            <span className="text-sm text-tinta-50">{plural(pendientes.length, 'cosa', 'cosas')}</span>
          )}
        </div>
        <p className="text-sm text-tinta-50 mb-4">Lo que está frenado esperando que alguien haga algo.</p>

        {pendientes.length === 0 ? (
          <Hoja className="p-6">
            <Estado tono="bien">Todo al día: no hay nada pendiente.</Estado>
          </Hoja>
        ) : (
          <Hoja className="divide-y divide-tinta/8 overflow-hidden">
            {pendientes.map((p, i) => (
              <Link
                key={i}
                to={p.a}
                className="flex items-start gap-4 p-5 hover:bg-papel-2/60 transition-colors"
              >
                <span className={`mt-1.5 punto ${colorPunto[p.tono]}`} />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{p.texto}</span>
                  <span className="block text-sm text-tinta-50 mt-0.5">{p.detalle}</span>
                </span>
                <span className="text-sm font-medium text-higo shrink-0">Ver →</span>
              </Link>
            ))}
          </Hoja>
        )}
      </section>

      {/* 3 · Las ferias que están vendiendo ahora mismo */}
      <section>
        <div className="entra flex flex-wrap items-baseline justify-between gap-4 mb-1">
          <h2 className="text-xl">
            {abiertas.length === 1
              ? 'La feria que está abierta'
              : `Las ${num(abiertas.length)} ferias que están abiertas`}
          </h2>
          <Link to="/eventos" className="text-sm font-medium text-higo hover:underline underline-offset-4">
            Ver todas las ferias →
          </Link>
        </div>
        <p className="entra text-sm text-tinta-50 mb-5">
          Están vendiendo en este momento. Cada una lleva su propia cuenta.
        </p>

        <div className="escalona grid gap-5 md:grid-cols-2">
          {abiertas.map(e => {
            const r = resultadoEvento(e.id)
            const j = jornadas.find(x => x.eventoId === e.id && x.estado === 'abierta')
            return (
              <Hoja key={e.id} viva className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Estado tono="bien" vivo>{e.provincia}</Estado>
                    <h3 className="text-xl mt-2 leading-snug">
                      <Link to={`/eventos/${e.id}`} className="hover:text-higo">{e.nombre}</Link>
                    </h3>
                    <p className="text-sm text-tinta-50 mt-1">{rango(e.desde, e.hasta)}</p>
                  </div>
                  <Chip tono={e.modoCarga === 'detallada' ? 'marca' : 'neutro'}>
                    {e.modoCarga === 'detallada' ? 'Carga cada venta' : 'Carga el total del día'}
                  </Chip>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-tinta/10">
                  <Dato etiqueta="Vendido" valor={money(r.bruto)} destacado />
                  <Dato etiqueta="Frascos" valor={num(r.unidades)} />
                  <Dato etiqueta="Ganancia" valor={money(r.margen)} tono={r.margen >= 0 ? 'bien' : 'mal'} />
                </div>

                <div className="flex flex-wrap gap-2 mt-6">
                  {j && (
                    <Link
                      to={`/venta/${e.id}`}
                      className="btn bg-higo text-papel px-5 py-2.5 rounded-xl text-sm"
                    >
                      Vender en el puesto
                    </Link>
                  )}
                  <Link
                    to={`/eventos/${e.id}`}
                    className="btn bg-papel border border-tinta/15 px-5 py-2.5 rounded-xl text-sm hover:bg-papel-2 hover:border-tinta/30"
                  >
                    Ver el detalle
                  </Link>
                </div>
              </Hoja>
            )
          })}
        </div>
      </section>

      {/* 4 · La pregunta de fondo del negocio */}
      <section className="entra">
        <h2 className="text-xl mb-1">¿Conviene más la feria o la web?</h2>
        <p className="text-sm text-tinta-50 mb-5 max-w-prose">
          Los dos canales sacan frascos del mismo depósito, así que se pueden comparar con la misma
          vara. Acá la ganancia es sólo la venta menos lo que costó hacer el frasco: no incluye
          sueldos ni gastos de feria.
        </p>
        <Hoja className="p-6 sm:p-8 space-y-7">
          {canales.map(c => (
            <div key={c.canal}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-2.5">
                <span className="font-semibold">{c.canal}</span>
                <span className="cifra text-2xl font-bold">{money(c.bruto)}</span>
              </div>
              <Barra
                valor={c.bruto}
                total={totalVendido}
                color={c.canal === 'Ferias' ? 'var(--color-higo)' : 'var(--color-damasco)'}
              />
              <p className="text-sm text-tinta-50 mt-2.5">
                {num(c.unidades)} frascos en {num(c.operaciones)} ventas · deja{' '}
                <span className="cifra font-medium text-tinta">{money(c.margenBruto)}</span> sobre el costo
              </p>
            </div>
          ))}
        </Hoja>
      </section>
    </div>
  )
}
