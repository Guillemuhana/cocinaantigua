import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { money, num, rango, fechaLarga } from '../lib/format'
import { Hoja, Dato, Chip, Estado } from '../components/ui'
import { Barras, BarraPartida } from '../components/graficos'

/* ===========================================================================
   Panel de inicio.

   Ordenado por urgencia, no por tema: primero cómo viene el año, después lo
   que hay que resolver hoy, después lo que está pasando, y al final los
   números para pensar. El dueño entra acá entre cliente y cliente, así que
   lo accionable va arriba de todo.
   =========================================================================== */

const nombreMedio = {
  efectivo: 'Efectivo',
  posnet: 'Tarjeta (posnet)',
  transferencia: 'Transferencia',
  qr: 'QR / billetera',
}

export default function Panel() {
  const s = useStore()
  const { eventos, resultadoEvento, arqueo, jornadas, stockWeb, pedidos, resultadoCanal } = s

  const abiertas = eventos.filter(e => e.estado === 'abierto')
  const canales = resultadoCanal()
  const totalVendido = canales.reduce((a, c) => a + c.bruto, 0)
  const totalFrascos = canales.reduce((a, c) => a + c.unidades, 0)
  const totalVentas = canales.reduce((a, c) => a + c.operaciones, 0)

  // Las ferias ya descuentan sueldos, canon y gastos; los canales web todavía
  // no tienen gastos de estructura cargados. Se aclara debajo del número.
  const gananciaFerias = eventos.reduce((a, e) => a + resultadoEvento(e.id).margen, 0)
  const gananciaWeb = canales.slice(1).reduce((a, c) => a + c.margenBruto, 0)
  const ganancia = gananciaFerias + gananciaWeb

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
      a: '/pedidos', tono: 'mal',
    },
    cajasAbiertas.length && {
      texto: plural(cajasAbiertas.length, 'caja sin cerrar', 'cajas sin cerrar'),
      detalle: cajasAbiertas
        .map(j => `${eventos.find(e => e.id === j.eventoId)?.nombre}: tendría que haber ${money(arqueo(j.id).esperado)} en efectivo`)
        .join(' · '),
      a: `/eventos/${cajasAbiertas[0].eventoId}`, tono: 'aviso',
    },
    agotados.length && {
      texto: plural(agotados.length, 'sabor agotado en la web', 'sabores agotados en la web'),
      detalle: `${agotados.map(w => w.producto.sabor).join(', ')} — no quedan frascos libres después de apartar los de las ferias.`,
      a: '/deposito', tono: 'aviso',
    },
    esperandoPago.length && {
      texto: plural(esperandoPago.length, 'pedido esperando el pago', 'pedidos esperando el pago'),
      detalle: 'Tienen la mercadería reservada por 48 horas.',
      a: '/pedidos', tono: 'neutro',
    },
  ].filter(Boolean)

  const colorPunto = { mal: 'text-membrillo', aviso: 'text-damasco', neutro: 'text-tinta-50' }

  /* --- Estadísticas ----------------------------------------------------- */
  const ranking = s.rankingProductos()
  const porFeria = s.ventasPorEvento()
  const medios = s.mediosDePago()
  const comisiones = medios.reduce((a, m) => a + m.comision, 0)
  const ticketPromedio = totalVentas > 0 ? totalVendido / totalVentas : 0
  const frascosPorVenta = totalVentas > 0 ? totalFrascos / totalVentas : 0

  return (
    <div className="space-y-10 sm:space-y-14">

      {/* 1 · Cómo viene el negocio, en tres números */}
      <section className="entra">
        <p className="text-sm text-tinta-50">{fechaLarga()}</p>
        <h1 className="display-2 mt-1.5">Así viene el año</h1>

        <Hoja className="mt-5 sm:mt-6 p-5 sm:p-8 grid gap-6 sm:gap-8 sm:grid-cols-3">
          <Dato etiqueta="Vendido" valor={money(totalVendido)} destacado
                detalle="Ferias, tienda online y revendedores" />
          <Dato etiqueta="Frascos vendidos" valor={num(totalFrascos)} destacado
                detalle={`En ${num(totalVentas)} ventas`} />
          <Dato etiqueta="Ganancia" valor={money(ganancia)} destacado
                tono={ganancia >= 0 ? 'bien' : 'mal'}
                detalle="Ya descontados los frascos, los sueldos, el canon y los gastos" />
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
              <Link key={i} to={p.a}
                className="flex items-start gap-4 p-5 hover:bg-papel-2/60 transition-colors">
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
              <Hoja key={e.id} viva className="p-5 sm:p-6">
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

                {/* Lo vendido va solo en su renglón: es la cifra más larga y,
                    metida en una columna de un tercio, se montaba encima de
                    la de al lado. Las otras dos van abajo, repartidas. */}
                <div className="mt-6 pt-6 border-t border-tinta/10">
                  <Dato etiqueta="Vendido" valor={money(r.bruto)} destacado
                        detalle={`${num(r.tickets)} ventas · ${money(r.ticketPromedio)} por venta`} />
                  <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-tinta/8">
                    <Dato etiqueta="Frascos" valor={num(r.unidades)} />
                    <Dato etiqueta="Ganancia" valor={money(r.margen)}
                          tono={r.margen >= 0 ? 'bien' : 'mal'} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-6">
                  {j && (
                    <Link to={`/venta/${e.id}`}
                      className="btn bg-higo text-papel px-5 py-2.5 rounded-xl text-sm">
                      Vender en el puesto
                    </Link>
                  )}
                  <Link to={`/eventos/${e.id}`}
                    className="btn bg-papel border border-tinta/15 px-5 py-2.5 rounded-xl text-sm hover:bg-papel-2 hover:border-tinta/30">
                    Ver el detalle
                  </Link>
                </div>
              </Hoja>
            )
          })}
        </div>
      </section>

      {/* 4 · Los números para pensar */}
      <section className="space-y-6">
        <div className="entra flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="display-2">Los números del año</h2>
            <p className="text-tinta-50 mt-2">
              Todo lo de abajo suma las ferias, la tienda online y los revendedores.
            </p>
          </div>
          <Link to="/reportes/anio"
            className="btn bg-papel border border-tinta/15 px-5 py-2.5 rounded-xl text-sm hover:bg-papel-2 hover:border-tinta/30 shrink-0">
            Descargar o imprimir ↓
          </Link>
        </div>

        {/* Tres promedios que ordenan el resto */}
        <Hoja className="entra p-5 sm:p-8 grid gap-6 sm:gap-8 sm:grid-cols-3">
          <Dato etiqueta="Venta promedio" valor={money(ticketPromedio)}
                detalle="lo que gasta cada cliente" />
          <Dato etiqueta="Frascos por venta" valor={frascosPorVenta.toFixed(1).replace('.', ',')}
                detalle="cuántos se lleva cada uno" />
          <Dato etiqueta="Comisiones pagadas" valor={money(comisiones)}
                tono={comisiones > 0 ? 'mal' : 'normal'}
                detalle="lo que se queda el posnet" />
        </Hoja>

        <div className="escalona grid gap-5 lg:grid-cols-2">
          {/* Ranking de sabores: la pregunta antes de cada tanda */}
          <Hoja className="p-5 sm:p-7">
            <h3 className="text-lg">Los sabores que más se venden</h3>
            <p className="text-sm text-tinta-50 mt-1.5 mb-6">
              En frascos, sumando feria y web. Es lo que conviene tener cocinado.
            </p>
            <Barras
              datos={ranking.map(r => ({
                clave: r.producto.id,
                etiqueta: r.producto.nombre,
                valor: r.unidades,
                valorTexto: `${num(r.unidades)} frascos`,
                detalle: `${money(r.bruto)} facturados`,
              }))}
            />
          </Hoja>

          {/* Comparación entre ferias */}
          <Hoja className="p-5 sm:p-7">
            <h3 className="text-lg">Lo que rindió cada feria</h3>
            <p className="text-sm text-tinta-50 mt-1.5 mb-6">
              Ordenadas por lo vendido. La ganancia ya descuenta sueldos y canon.
            </p>
            <Barras
              datos={porFeria.map(r => ({
                clave: r.evento.id,
                etiqueta: r.evento.nombre,
                valor: r.bruto,
                valorTexto: money(r.bruto),
                detalle: `${r.evento.provincia} · ${num(r.unidades)} frascos · ${
                  r.margen >= 0 ? 'dejó' : 'perdió'} ${money(Math.abs(r.margen))}`,
              }))}
            />
          </Hoja>

          {/* Canales: tres series, así que van con color propio y nombre al lado */}
          <Hoja className="p-5 sm:p-7">
            <h3 className="text-lg">¿Por dónde entra la plata?</h3>
            <p className="text-sm text-tinta-50 mt-1.5 mb-6">
              Los tres canales sacan frascos del mismo depósito, así que se comparan con la
              misma vara.
            </p>
            <Barras
              porSerie
              datos={canales.map(c => ({
                clave: c.canal,
                etiqueta: c.canal,
                valor: c.bruto,
                valorTexto: money(c.bruto),
                detalle: `${num(c.unidades)} frascos en ${num(c.operaciones)} ventas · deja ${
                  money(c.margenBruto)} sobre el costo del frasco`,
              }))}
            />
          </Hoja>

          {/* Medios de pago */}
          <Hoja className="p-5 sm:p-7">
            <h3 className="text-lg">Cómo paga la gente en la feria</h3>
            <p className="text-sm text-tinta-50 mt-1.5 mb-6">
              Cuanto más efectivo, menos comisión — pero más plata que contar al cierre.
            </p>
            <BarraPartida
              tramos={medios.map(m => ({
                clave: m.medio,
                etiqueta: nombreMedio[m.medio] ?? m.medio,
                valor: m.bruto,
                valorTexto: money(m.bruto),
              }))}
            />
            {comisiones > 0 && (
              <p className="text-sm text-tinta-50 mt-6 pt-5 border-t border-tinta/10">
                De todo eso, <span className="cifra font-medium text-membrillo">{money(comisiones)}</span>{' '}
                se los quedó el posnet en comisiones.
              </p>
            )}
          </Hoja>
        </div>
      </section>
    </div>
  )
}
