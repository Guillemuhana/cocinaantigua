import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { money, num, rango, etiquetaEgreso } from '../lib/format'
import { Placa, Hoja, Dato, Chip, Boton, Barra } from '../components/ui'

const SOLAPAS = ['Stock', 'Caja', 'Gastos', 'Equipo']

export default function EventoDetalle() {
  const { id } = useParams()
  const s = useStore()
  const [solapa, setSolapa] = useState('Stock')

  const e = s.evento(id)
  if (!e) return <p>No encontramos ese evento.</p>

  const r = s.resultadoEvento(id)
  const jornadaAbierta = s.jornadas.find(j => j.eventoId === id && j.estado === 'abierta')

  return (
    <div className="space-y-8">
      <div>
        <Link to="/eventos" className="text-sm font-medium text-tinta-50 hover:text-higo">← Eventos</Link>
        <div className="flex flex-wrap items-end justify-between gap-4 mt-3">
          <div>
            <Placa sub={`${e.localidad}, ${e.provincia} · ${rango(e.desde, e.hasta)}`}>{e.nombre}</Placa>
          </div>
          {jornadaAbierta && (
            <Link to={`/venta/${e.id}`} className="btn bg-higo text-papel px-4 py-2.5 rounded-lg text-sm">
              Abrir punto de venta
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 py-5 border-y border-tinta/12">
        <Dato etiqueta="Vendido" valor={money(r.bruto)} detalle={`${num(r.tickets)} operaciones`} />
        <Dato etiqueta="Cobrado neto" valor={money(r.neto)} detalle="descontando comisiones" />
        <Dato etiqueta="Costos y gastos" valor={money(r.costo + r.gastosTotales)} detalle="incluye canon y jornales" />
        <Dato etiqueta="Margen del evento" valor={money(r.margen)} tono={r.margen >= 0 ? 'bien' : 'mal'} />
      </div>

      <div className="flex gap-1 flex-wrap">
        {SOLAPAS.map(t => (
          <button key={t} onClick={() => setSolapa(t)}
            className={`eyebrow px-3 py-2 rounded-lg transition-colors ${
              solapa === t ? 'bg-higo text-papel' : 'text-tinta-50 hover:text-tinta hover:bg-papel-2'}`}>
            {t}
          </button>
        ))}
      </div>

      {solapa === 'Stock'  && <Stock  s={s} id={id} />}
      {solapa === 'Caja'   && <Caja   s={s} id={id} />}
      {solapa === 'Gastos' && <Gastos s={s} id={id} />}
      {solapa === 'Equipo' && <Equipo s={s} id={id} />}
    </div>
  )
}

/* --- Conciliación de stock: la ecuación que tiene que cerrar --------------- */
function Stock({ s, id }) {
  const filas = s.stockEvento(id)
  const egresos = s.egresosNoVenta.filter(g => g.eventoId === id)

  return (
    <div className="space-y-6">
      <p className="text-sm text-tinta-50 max-w-prose">
        Lo que salió del depósito, menos lo vendido, menos lo que se rompió o se regaló, tiene que dar
        lo que queda en la caja. Si no da, la diferencia se ve acá el mismo día.
      </p>

      <Hoja className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="border-b border-tinta/12 text-left">
              <th className="eyebrow text-tinta-50 font-normal px-4 py-3">Producto</th>
              <th className="eyebrow text-tinta-50 font-normal px-4 py-3 text-right">Llevado</th>
              <th className="eyebrow text-tinta-50 font-normal px-4 py-3 text-right">Vendido</th>
              <th className="eyebrow text-tinta-50 font-normal px-4 py-3 text-right">No venta</th>
              <th className="eyebrow text-tinta-50 font-normal px-4 py-3 text-right">Queda</th>
              <th className="eyebrow text-tinta-50 font-normal px-4 py-3 w-32">Rotación</th>
            </tr>
          </thead>
          <tbody>
            {filas.map(f => (
              <tr key={f.producto.id} className="border-b border-tinta/8 last:border-0">
                <td className="px-4 py-3">
                  <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                        style={{ background: f.producto.color }} />
                  {f.producto.nombre}
                </td>
                <td className="px-4 py-3 text-right cifra">{num(f.ingresos)}</td>
                <td className="px-4 py-3 text-right cifra">{num(f.vendidas)}</td>
                <td className="px-4 py-3 text-right cifra text-membrillo">
                  {f.egresos > 0 ? `−${num(f.egresos)}` : '—'}
                </td>
                <td className="px-4 py-3 text-right cifra font-semibold">{num(f.teorico)}</td>
                <td className="px-4 py-3">
                  <Barra valor={f.vendidas} total={f.ingresos} color={f.producto.color} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Hoja>

      <div>
        <h3 className="font-display text-lg mb-3">Salidas que no fueron venta</h3>
        <Hoja className="divide-y divide-tinta/8">
          {egresos.length === 0 && <p className="p-4 text-sm text-tinta-50">Nada registrado todavía.</p>}
          {egresos.map(g => (
            <div key={g.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm">{s.producto(g.productoId)?.nombre}</p>
                <p className="text-xs text-tinta-50 mt-0.5">{g.motivo}</p>
              </div>
              <div className="flex items-center gap-3">
                <Chip tono={g.tipo === 'rotura' ? 'mal' : 'neutro'}>{etiquetaEgreso[g.tipo]}</Chip>
                <span className="cifra text-sm w-12 text-right">−{g.cantidad}</span>
              </div>
            </div>
          ))}
        </Hoja>
      </div>
    </div>
  )
}

/* --- Arqueo: el control real sobre el efectivo ----------------------------- */
function Caja({ s, id }) {
  const jornadas = s.jornadas.filter(j => j.eventoId === id)
  const medios = s.ventasPorMedio(id)
  const totalBruto = medios.reduce((a, m) => a + m.bruto, 0)
  const [contado, setContado] = useState('')

  const etiquetas = { efectivo: 'Efectivo', transferencia: 'Transferencia', posnet: 'Posnet', qr: 'QR' }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg mb-1">Cómo pagaron</h3>
        <p className="text-sm text-tinta-50 mb-4 max-w-prose">
          El posnet no es plata cobrada: tiene comisión y se acredita después. Por eso se muestra
          el bruto y el neto por separado.
        </p>
        <Hoja className="p-5 space-y-5">
          {medios.map(m => (
            <div key={m.medio}>
              <div className="flex items-baseline justify-between gap-4 mb-2">
                <span className="text-sm font-medium">{etiquetas[m.medio] || m.medio}</span>
                <span className="cifra text-sm">
                  {money(m.bruto)}
                  {m.neto !== m.bruto && (
                    <span className="text-membrillo ml-2">neto {money(m.neto)}</span>
                  )}
                </span>
              </div>
              <Barra valor={m.bruto} total={totalBruto} />
            </div>
          ))}
        </Hoja>
      </div>

      <div>
        <h3 className="font-display text-lg mb-3">Arqueo por jornada</h3>
        <div className="space-y-3">
          {jornadas.map(j => {
            const a = s.arqueo(j.id)
            const abierta = j.estado === 'abierta'
            return (
              <Hoja key={j.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{new Date(j.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    <Chip tono={abierta ? 'aviso' : 'neutro'}>{abierta ? 'Abierta' : 'Cerrada'}</Chip>
                  </div>
                  {!abierta && a.diferencia !== null && (
                    <Chip tono={Math.abs(a.diferencia) < 1 ? 'bien' : 'mal'}>
                      {a.diferencia === 0 ? 'Cuadra' : `Diferencia ${money(a.diferencia)}`}
                    </Chip>
                  )}
                </div>

                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div><dt className="eyebrow text-tinta-50">Fondo</dt><dd className="cifra mt-1">{money(a.jornada.fondoInicial)}</dd></div>
                  <div><dt className="eyebrow text-tinta-50">+ Ventas efectivo</dt><dd className="cifra mt-1">{money(a.ventasEfectivo)}</dd></div>
                  <div><dt className="eyebrow text-tinta-50">− Gastos de caja</dt><dd className="cifra mt-1">{money(a.gastosCaja)}</dd></div>
                  <div><dt className="eyebrow text-tinta-50">= Debería haber</dt><dd className="cifra mt-1 font-semibold">{money(a.esperado)}</dd></div>
                </dl>

                {abierta && (
                  <div className="mt-5 pt-5 border-t border-tinta/10 flex flex-wrap items-end gap-3">
                    <label className="flex-1 min-w-48">
                      <span className="eyebrow text-tinta-50 block mb-1.5">Efectivo contado</span>
                      <input
                        type="number" inputMode="numeric" value={contado}
                        onChange={ev => setContado(ev.target.value)}
                        placeholder="0"
                        className="cifra w-full px-3 py-2.5 rounded-lg border border-tinta/20 bg-papel focus:border-higo outline-none"
                      />
                    </label>
                    <Boton
                      disabled={contado === ''}
                      onClick={() => {
                        s.dispatch({ type: 'CERRAR_JORNADA', payload: { jornadaId: j.id, efectivoContado: Number(contado) } })
                        setContado('')
                      }}>
                      Cerrar la caja
                    </Boton>
                  </div>
                )}
              </Hoja>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Gastos({ s, id }) {
  const gastos = s.gastos.filter(g => g.eventoId === id)
  const e = s.evento(id)
  const total = gastos.reduce((a, g) => a + g.importe, 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-6">
        <Dato etiqueta="Gastos cargados" valor={money(total)} />
        <Dato etiqueta="Canon del stand" valor={money(e.canon)} detalle="acordado antes de salir" />
      </div>

      <Hoja className="divide-y divide-tinta/8">
        {gastos.map(g => (
          <div key={g.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm">{g.descripcion}</p>
              <p className="eyebrow text-tinta-50 mt-1">{g.categoria}</p>
            </div>
            <div className="flex items-center gap-3">
              <Chip tono={g.pagadoPor === 'caja_evento' ? 'aviso' : 'neutro'}>
                {g.pagadoPor === 'caja_evento' ? 'De la caja' : 'Lo pagó la empresa'}
              </Chip>
              <span className="cifra text-sm w-28 text-right">{money(g.importe)}</span>
            </div>
          </div>
        ))}
      </Hoja>

      <p className="text-xs text-tinta-50 max-w-prose">
        Los gastos pagados de la caja del evento salen del efectivo del día y afectan el arqueo.
        Los que paga la empresa por transferencia, no.
      </p>
    </div>
  )
}

function Equipo({ s, id }) {
  const filas = s.liquidacion(id)
  const modalidades = { jornal: 'Jornal fijo', comision: 'Solo comisión', jornal_comision: 'Jornal + comisión' }

  return (
    <div className="space-y-5">
      <p className="text-sm text-tinta-50 max-w-prose">
        Cada persona cobra distinto. La app calcula lo que le corresponde y descuenta los adelantos
        que ya se llevó durante la feria.
      </p>

      <Hoja className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-tinta/12 text-left">
              <th className="eyebrow text-tinta-50 font-normal px-4 py-3">Persona</th>
              <th className="eyebrow text-tinta-50 font-normal px-4 py-3">Modalidad</th>
              <th className="eyebrow text-tinta-50 font-normal px-4 py-3 text-right">Jornales</th>
              <th className="eyebrow text-tinta-50 font-normal px-4 py-3 text-right">Comisión</th>
              <th className="eyebrow text-tinta-50 font-normal px-4 py-3 text-right">Adelantos</th>
              <th className="eyebrow text-tinta-50 font-normal px-4 py-3 text-right">A pagar</th>
            </tr>
          </thead>
          <tbody>
            {filas.map(f => (
              <tr key={f.personalId} className="border-b border-tinta/8 last:border-0">
                <td className="px-4 py-3">
                  {f.persona?.nombre}
                  <span className="eyebrow text-tinta-50 ml-2">{f.rol}</span>
                </td>
                <td className="px-4 py-3 text-tinta-50">{modalidades[f.modalidad]}</td>
                <td className="px-4 py-3 text-right cifra">{f.base ? money(f.base) : '—'}</td>
                <td className="px-4 py-3 text-right cifra">{f.comision ? money(f.comision) : '—'}</td>
                <td className="px-4 py-3 text-right cifra text-membrillo">{f.adelantos ? `−${money(f.adelantos)}` : '—'}</td>
                <td className="px-4 py-3 text-right cifra font-semibold">{money(f.aPagar)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Hoja>
    </div>
  )
}
