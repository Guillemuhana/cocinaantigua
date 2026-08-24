import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { money, num, etiquetaEgreso } from '../lib/format'

/* ===========================================================================
   Punto de venta.

   Pantalla oscura a propósito: se usa afuera, al sol, y el vendedor ya está
   acostumbrado a leer los precios de un pizarrón. Botones grandes, una sola
   mano, sin formularios. Si cobrar tarda más que contar los frascos, nadie
   la usa y los datos terminan siendo basura.
   =========================================================================== */

const MEDIOS = [
  { id: 'efectivo',      texto: 'Efectivo',      comision: 0 },
  { id: 'transferencia', texto: 'Transferencia', comision: 0 },
  { id: 'posnet',        texto: 'Posnet',        comision: 6.5 },
]

export default function PuntoVenta() {
  const { id } = useParams()
  const s = useStore()
  const e = s.evento(id)

  const [carrito, setCarrito] = useState([])
  const [cobrando, setCobrando] = useState(false)
  const [pagos, setPagos] = useState([])
  const [vendedorId, setVendedorId] = useState(e?.equipo?.[0]?.personalId ?? '')
  const [aviso, setAviso] = useState(null)
  const [panelEgreso, setPanelEgreso] = useState(false)

  const stock = useMemo(() => {
    const m = {}
    s.stockEvento(id).forEach(f => { m[f.producto.id] = f.teorico })
    return m
  }, [s, id])

  if (!e) return <p className="p-6">No encontramos ese evento.</p>

  const disponibles = s.stockEvento(id).map(f => f.producto)
  const total = carrito.reduce((a, i) => a + i.cantidad * i.precio, 0)
  const pagado = pagos.reduce((a, p) => a + p.importe, 0)
  const falta = total - pagado

  const agregar = (p) => {
    setCarrito(c => {
      const y = c.find(i => i.productoId === p.id)
      return y
        ? c.map(i => i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1 } : i)
        : [...c, { productoId: p.id, cantidad: 1, precio: p.precio }]
    })
  }

  const cambiar = (productoId, delta) =>
    setCarrito(c => c
      .map(i => i.productoId === productoId ? { ...i, cantidad: i.cantidad + delta } : i)
      .filter(i => i.cantidad > 0))

  const confirmar = () => {
    const jornada = s.jornadas.find(j => j.eventoId === id && j.estado === 'abierta')
    s.dispatch({
      type: 'REGISTRAR_VENTA',
      payload: {
        eventoId: id, jornadaId: jornada?.id ?? null, vendedorId,
        items: carrito, tipo: 'detallada',
        pagos: pagos.map(p => ({ ...p, comision: MEDIOS.find(m => m.id === p.medio)?.comision || 0 })),
      },
    })
    setAviso(`Venta registrada por ${money(total)}`)
    setCarrito([]); setPagos([]); setCobrando(false)
    setTimeout(() => setAviso(null), 3200)
  }

  return (
    <div className="min-h-dvh bg-pizarra text-tiza">
      <header className="border-b border-tiza/15 sticky top-0 bg-pizarra/95 backdrop-blur z-20">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-4">
          <Link to={`/eventos/${id}`} className="eyebrow text-tiza/60 hover:text-tiza">← Salir</Link>
          <div className="min-w-0">
            <p className="font-display italic text-lg truncate leading-tight">{e.nombre}</p>
            <p className="eyebrow text-tiza/50">{e.provincia}</p>
          </div>
          <label className="ml-auto flex items-center gap-2">
            <span className="eyebrow text-tiza/50 hidden sm:inline">Vende</span>
            <select
              value={vendedorId} onChange={ev => setVendedorId(ev.target.value)}
              className="bg-pizarra-2 border border-tiza/20 rounded-sm px-3 py-2 text-sm text-tiza">
              {e.equipo.map(m => (
                <option key={m.personalId} value={m.personalId}>{s.persona(m.personalId)?.nombre}</option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {aviso && (
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <p className="bg-laurel/25 border border-laurel/50 text-tiza px-4 py-3 rounded-sm text-sm">{aviso}</p>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Grilla de sabores */}
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-xl">Tocá el sabor</h2>
            <button onClick={() => setPanelEgreso(v => !v)}
              className="eyebrow text-tiza/60 hover:text-damasco underline underline-offset-4">
              Registrar rotura o degustación
            </button>
          </div>

          {panelEgreso && <PanelEgreso s={s} id={id} productos={disponibles} onListo={() => setPanelEgreso(false)} />}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {disponibles.map(p => {
              const queda = stock[p.id] ?? 0
              return (
                <button
                  key={p.id}
                  onClick={() => agregar(p)}
                  disabled={queda <= 0}
                  className="group text-left p-4 rounded-sm bg-pizarra-2 border border-tiza/12
                             hover:border-damasco active:translate-y-px transition
                             disabled:opacity-35 disabled:cursor-not-allowed min-h-28 flex flex-col"
                >
                  <span className="w-7 h-1.5 rounded-full mb-3" style={{ background: p.color }} />
                  <span className="font-display text-base leading-tight">{p.sabor}</span>
                  <span className="eyebrow text-tiza/45 mt-0.5">{p.presentacion} g</span>
                  <span className="mt-auto pt-3 flex items-baseline justify-between">
                    <span className="cifra text-lg group-hover:text-damasco transition-colors">{money(p.precio)}</span>
                    <span className={`eyebrow ${queda < 15 ? 'text-damasco' : 'text-tiza/40'}`}>{num(queda)}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Carrito */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="bg-pizarra-2 border border-tiza/15 rounded-sm">
            <div className="px-4 py-3 border-b border-tiza/12 flex items-center justify-between">
              <span className="eyebrow text-tiza/60">Esta venta</span>
              {carrito.length > 0 && (
                <button onClick={() => { setCarrito([]); setPagos([]) }}
                        className="eyebrow text-tiza/45 hover:text-membrillo">Vaciar</button>
              )}
            </div>

            {carrito.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-tiza/40">
                Todavía no cargaste nada.
              </p>
            ) : (
              <ul className="divide-y divide-tiza/10">
                {carrito.map(i => {
                  const p = s.producto(i.productoId)
                  return (
                    <li key={i.productoId} className="px-4 py-3 flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm truncate">{p.sabor}</p>
                        <p className="cifra text-xs text-tiza/45 mt-0.5">{money(i.precio)} c/u</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BotonCantidad onClick={() => cambiar(i.productoId, -1)} rotulo="Quitar uno">−</BotonCantidad>
                        <span className="cifra w-7 text-center">{i.cantidad}</span>
                        <BotonCantidad onClick={() => cambiar(i.productoId, +1)} rotulo="Agregar uno">+</BotonCantidad>
                      </div>
                      <span className="cifra text-sm w-20 text-right">{money(i.cantidad * i.precio)}</span>
                    </li>
                  )
                })}
              </ul>
            )}

            <div className="px-4 py-4 border-t border-tiza/15">
              <div className="flex items-baseline justify-between mb-4">
                <span className="eyebrow text-tiza/60">Total</span>
                <span className="cifra text-3xl font-semibold">{money(total)}</span>
              </div>
              <button
                onClick={() => { setCobrando(true); setPagos([]) }}
                disabled={carrito.length === 0}
                className="btn w-full bg-damasco text-tinta py-3.5 rounded-sm font-semibold disabled:opacity-30">
                Cobrar
              </button>
            </div>
          </div>
        </aside>
      </div>

      {cobrando && (
        <Cobro
          total={total} pagos={pagos} setPagos={setPagos} falta={falta} pagado={pagado}
          onCerrar={() => setCobrando(false)} onConfirmar={confirmar}
        />
      )}
    </div>
  )
}

function BotonCantidad({ children, onClick, rotulo }) {
  return (
    <button onClick={onClick} aria-label={rotulo}
      className="w-9 h-9 rounded-sm border border-tiza/25 hover:border-damasco hover:text-damasco
                 text-lg leading-none flex items-center justify-center transition-colors">
      {children}
    </button>
  )
}

/* --- Cobro con pago dividido ---------------------------------------------- */
function Cobro({ total, pagos, setPagos, falta, pagado, onCerrar, onConfirmar }) {
  const [monto, setMonto] = useState('')
  const [medio, setMedio] = useState('efectivo')

  const sumar = (importe) => {
    if (!importe || importe <= 0) return
    setPagos(p => [...p, { medio, importe }])
    setMonto('')
  }

  const efectivoRecibido = Number(monto || 0)
  const vuelto = medio === 'efectivo' && efectivoRecibido > falta ? efectivoRecibido - falta : 0

  return (
    <div className="fixed inset-0 z-30 bg-pizarra/92 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
         role="dialog" aria-modal="true">
      <div className="w-full sm:max-w-md bg-pizarra-2 border border-tiza/20 rounded-t-lg sm:rounded-sm">
        <div className="px-5 py-4 border-b border-tiza/12 flex items-center justify-between">
          <span className="font-display text-lg">Cobrar {money(total)}</span>
          <button onClick={onCerrar} className="eyebrow text-tiza/50 hover:text-tiza">Cerrar</button>
        </div>

        <div className="p-5 space-y-5">
          {pagos.length > 0 && (
            <ul className="space-y-2">
              {pagos.map((p, i) => (
                <li key={i} className="flex items-center justify-between text-sm bg-pizarra/60 px-3 py-2 rounded-sm">
                  <span className="capitalize">{p.medio}</span>
                  <span className="flex items-center gap-3">
                    <span className="cifra">{money(p.importe)}</span>
                    <button onClick={() => setPagos(ps => ps.filter((_, j) => j !== i))}
                            className="eyebrow text-tiza/40 hover:text-membrillo">quitar</button>
                  </span>
                </li>
              ))}
            </ul>
          )}

          {falta > 0 && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {MEDIOS.map(m => (
                  <button key={m.id} onClick={() => setMedio(m.id)}
                    className={`py-3 rounded-sm text-sm border transition-colors ${
                      medio === m.id
                        ? 'bg-tiza text-pizarra border-tiza font-semibold'
                        : 'border-tiza/20 text-tiza/70 hover:border-tiza/50'}`}>
                    {m.texto}
                  </button>
                ))}
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="eyebrow text-tiza/60">Importe</span>
                  <button onClick={() => setMonto(String(falta))}
                          className="eyebrow text-damasco hover:underline underline-offset-4">
                    Todo: {money(falta)}
                  </button>
                </div>
                <input
                  type="number" inputMode="numeric" value={monto} autoFocus
                  onChange={e => setMonto(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sumar(Number(monto))}
                  placeholder="0"
                  className="cifra w-full text-2xl px-4 py-3 rounded-sm bg-pizarra border border-tiza/25
                             focus:border-damasco outline-none text-tiza"
                />
                {vuelto > 0 && (
                  <p className="text-sm text-damasco mt-2">Vuelto: <span className="cifra">{money(vuelto)}</span></p>
                )}
              </div>

              <button onClick={() => sumar(Math.min(Number(monto), falta))}
                      disabled={!monto || Number(monto) <= 0}
                      className="btn w-full border border-tiza/30 py-3 rounded-sm text-sm hover:bg-pizarra disabled:opacity-30">
                Agregar este pago
              </button>
            </>
          )}

          <div className="pt-4 border-t border-tiza/12 space-y-1.5 text-sm">
            <div className="flex justify-between text-tiza/60">
              <span>Cobrado</span><span className="cifra">{money(pagado)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>{falta > 0 ? 'Falta' : 'Completo'}</span>
              <span className={`cifra ${falta > 0 ? 'text-damasco' : 'text-laurel'}`}>{money(Math.max(falta, 0))}</span>
            </div>
          </div>

          <button onClick={onConfirmar} disabled={falta > 0}
            className="btn w-full bg-laurel text-tiza py-3.5 rounded-sm font-semibold disabled:opacity-30">
            Confirmar la venta
          </button>
        </div>
      </div>
    </div>
  )
}

/* --- Egresos que no son venta --------------------------------------------- */
function PanelEgreso({ s, id, productos, onListo }) {
  const [productoId, setProductoId] = useState(productos[0]?.id ?? '')
  const [tipo, setTipo] = useState('degustacion')
  const [cantidad, setCantidad] = useState(1)
  const [motivo, setMotivo] = useState('')

  return (
    <div className="mb-4 p-4 rounded-sm bg-pizarra-2 border border-damasco/40 grid gap-3 sm:grid-cols-[1fr_1fr_80px_auto]">
      <select value={productoId} onChange={e => setProductoId(e.target.value)}
        className="bg-pizarra border border-tiza/20 rounded-sm px-3 py-2.5 text-sm text-tiza">
        {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
      </select>
      <select value={tipo} onChange={e => setTipo(e.target.value)}
        className="bg-pizarra border border-tiza/20 rounded-sm px-3 py-2.5 text-sm text-tiza">
        {['degustacion', 'rotura', 'regalo', 'consumo_interno', 'canje'].map(t =>
          <option key={t} value={t}>{etiquetaEgreso[t]}</option>)}
      </select>
      <input type="number" min="1" value={cantidad} onChange={e => setCantidad(Number(e.target.value))}
        className="cifra bg-pizarra border border-tiza/20 rounded-sm px-3 py-2.5 text-sm text-tiza" />
      <button
        onClick={() => {
          s.dispatch({ type: 'REGISTRAR_EGRESO', payload: {
            eventoId: id, productoId, tipo, cantidad,
            motivo: motivo || etiquetaEgreso[tipo], fecha: new Date().toISOString().slice(0, 10) } })
          onListo()
        }}
        className="btn bg-damasco text-tinta px-4 py-2.5 rounded-sm text-sm">
        Registrar
      </button>
      <input value={motivo} onChange={e => setMotivo(e.target.value)}
        placeholder="Motivo (opcional): se cayó una caja, muestra para la radio…"
        className="sm:col-span-4 bg-pizarra border border-tiza/20 rounded-sm px-3 py-2.5 text-sm text-tiza placeholder:text-tiza/35" />
    </div>
  )
}
