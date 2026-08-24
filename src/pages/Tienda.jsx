import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { money, num } from '../lib/format'
import { descripcionesWeb } from '../lib/demoData'

/* ===========================================================================
   Tienda pública.

   Lo que un visitante ve. El hero no arranca con el producto sino con las
   ferias: es lo que distingue a esta marca de cualquier mermelada de góndola,
   y lo que hace que alguien de Neuquén confíe en comprarle a un desconocido.
   =========================================================================== */

export default function Tienda() {
  const s = useStore()
  const [abierto, setAbierto] = useState(false)
  const [paso, setPaso] = useState('catalogo')
  const [datos, setDatos] = useState({ nombre: '', email: '', localidad: '', envioId: 'me3' })
  const [confirmado, setConfirmado] = useState(null)

  const stock = useMemo(() => {
    const m = {}
    s.stockWeb().forEach(w => { m[w.producto.id] = w.disponible })
    return m
  }, [s])

  const catalogo = s.productos.filter(p => p.visibleWeb)
  const carrito = s.carritoWeb
  const unidades = carrito.reduce((a, i) => a + i.cantidad, 0)
  const subtotal = carrito.reduce((a, i) => a + i.cantidad * i.precio, 0)

  const envio = s.metodosEnvio.find(m => m.id === datos.envioId)
  const costoEnvio = !envio ? 0
    : (envio.gratisDesde && subtotal >= envio.gratisDesde ? 0 : envio.costo)
  const total = subtotal + costoEnvio

  const confirmarPedido = () => {
    s.dispatch({ type: 'CREAR_PEDIDO', payload: {
      cliente: datos.nombre, email: datos.email, localidad: datos.localidad,
      envio: costoEnvio, medio: 'transferencia',
      items: carrito.map(i => ({ productoId: i.productoId, cantidad: i.cantidad, precio: i.precio })),
    }})
    setConfirmado({ total, nombre: datos.nombre })
    setPaso('catalogo')
    setAbierto(false)
  }

  return (
    <div className="min-h-dvh bg-papel">
      <header className="border-b border-tinta/12 sticky top-0 bg-papel/90 backdrop-blur z-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <img src="/marca.png" alt="" width="36" height="36" className="w-9 h-9 shrink-0" />
            <div>
              <p className="text-lg font-semibold tracking-tight leading-none">Cocina Antigua</p>
              <p className="text-xs text-tinta-50 mt-1">Mermeladas de olla</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link to="/" className="text-sm font-medium text-tinta-50 hover:text-higo hidden sm:inline">Volver al sistema</Link>
            <button onClick={() => setAbierto(true)}
              className="btn bg-higo text-papel px-4 py-2.5 rounded-lg text-sm">
              Carrito {unidades > 0 && <span className="cifra">({unidades})</span>}
            </button>
          </div>
        </div>
      </header>

      {confirmado && (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-6">
          <div className="border border-laurel/40 bg-laurel/10 px-5 py-4 rounded-lg">
            <p className="font-display text-lg text-laurel">Listo, {confirmado.nombre}</p>
            <p className="text-sm text-tinta-50 mt-1">
              Tu pedido por {money(confirmado.total)} quedó reservado. Te mandamos los datos para
              transferir por mail — tenés 48 horas antes de que se libere el stock.
            </p>
            <Link to="/pedidos" className="text-sm font-medium text-higo mt-3 inline-block hover:underline underline-offset-4">
              Verlo entrar en la bandeja de pedidos →
            </Link>
          </div>
        </div>
      )}

      {/* Hero: lo que hace distinta a esta marca son las ferias */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pt-14 pb-12">
        <p className="eyebrow text-higo">Desde 2016 · Producción familiar</p>
        <h1 className="font-display text-4xl sm:text-6xl leading-[0.95] mt-4 max-w-2xl">
          Diez años cocinando en olla<br />
          <span className="text-higo">y viajando con la olla</span>
        </h1>
        <p className="mt-6 max-w-lg text-tinta-50 leading-relaxed">
          Nos vas a encontrar en la Fiesta del Poncho, en la Feria de las Colectividades, en Vendimia
          y en Expo Chaco. Si no llegás a ninguna, ahora te la mandamos a casa.
        </p>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
          {['Catamarca', 'Córdoba', 'Mendoza', 'Chaco', 'Neuquén', 'Buenos Aires'].map(p => (
            <span key={p} className="eyebrow text-tinta-50">{p}</span>
          ))}
        </div>
      </section>

      {/* Catálogo */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-20">
        <h2 className="text-2xl mb-8">Lo que hay ahora</h2>

        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {catalogo.map(p => {
            const queda = stock[p.id] ?? 0
            const agotado = queda === 0
            return (
              <article key={p.id} className="flex flex-col">
                {/* Sin fotos reales: un frasco dibujado con el color del sabor.
                    Cuando el cliente mande fotos, va una imagen acá. */}
                <div className="aspect-[4/5] rounded-lg flex items-end justify-center overflow-hidden"
                     style={{ background: `color-mix(in srgb, ${p.color} 10%, #F8FAFC)` }}>
                  <Frasco color={p.color} agotado={agotado} />
                </div>

                <div className="mt-4 flex-1 flex flex-col">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-lg leading-tight">{p.nombre}</h3>
                    <span className="cifra text-lg shrink-0">{money(p.precioWeb)}</span>
                  </div>
                  <p className="eyebrow text-tinta-50 mt-1">{p.presentacion} g</p>
                  <p className="text-sm text-tinta-50 mt-2.5 leading-relaxed flex-1">
                    {descripcionesWeb[p.id]}
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    <button
                      disabled={agotado}
                      onClick={() => s.dispatch({ type: 'CARRITO_AGREGAR', payload: { productoId: p.id, cantidad: 1, precio: p.precioWeb } })}
                      className="btn flex-1 border border-tinta/25 py-2.5 rounded-lg text-sm hover:bg-papel-2
                                 disabled:opacity-35 disabled:cursor-not-allowed">
                      {agotado ? 'Sin stock' : 'Agregar'}
                    </button>
                    {!agotado && queda <= 20 && (
                      <span className="eyebrow text-damasco whitespace-nowrap">Quedan {num(queda)}</span>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <footer className="border-t border-tinta/12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 grid gap-6 sm:grid-cols-3 text-sm text-tinta-50">
          <div>
            <p className="eyebrow text-tinta">Cómo se paga</p>
            <p className="mt-2 leading-relaxed">Transferencia o Mercado Pago. Te reservamos el pedido 48 horas.</p>
          </div>
          <div>
            <p className="eyebrow text-tinta">Cómo llega</p>
            <p className="mt-2 leading-relaxed">Correo Argentino a todo el país, o lo retirás en nuestro stand si venimos a tu feria.</p>
          </div>
          <div>
            <p className="eyebrow text-tinta">Dudas</p>
            <p className="mt-2 leading-relaxed">Escribinos por WhatsApp y te contestamos el mismo día.</p>
          </div>
        </div>
      </footer>

      {/* Carrito lateral */}
      {abierto && (
        <div className="fixed inset-0 z-30 flex justify-end" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-tinta/40" onClick={() => setAbierto(false)} />
          <div className="relative w-full sm:max-w-md bg-papel border-l border-tinta/15 flex flex-col">
            <div className="px-5 py-4 border-b border-tinta/12 flex items-center justify-between">
              <span className="font-display text-lg">
                {paso === 'catalogo' ? 'Tu pedido' : 'Tus datos'}
              </span>
              <button onClick={() => setAbierto(false)} className="text-sm font-medium text-tinta-50 hover:text-higo">Cerrar</button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {carrito.length === 0 ? (
                <p className="p-10 text-center text-sm text-tinta-50">
                  Todavía no elegiste nada. Volvé al catálogo y agregá algún frasco.
                </p>
              ) : paso === 'catalogo' ? (
                <ul className="divide-y divide-tinta/8">
                  {carrito.map(i => {
                    const p = s.producto(i.productoId)
                    return (
                      <li key={i.productoId} className="p-4 flex items-center gap-3">
                        <span className="w-1.5 h-10 rounded-full shrink-0" style={{ background: p.color }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm truncate">{p.nombre}</p>
                          <p className="cifra text-xs text-tinta-50 mt-0.5">{money(i.precio)} c/u</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => s.dispatch({ type: 'CARRITO_CANTIDAD', payload: { productoId: i.productoId, cantidad: i.cantidad - 1 } })}
                            aria-label="Quitar uno"
                            className="w-8 h-8 rounded-lg border border-tinta/20 hover:border-higo">−</button>
                          <span className="cifra w-6 text-center text-sm">{i.cantidad}</span>
                          <button onClick={() => s.dispatch({ type: 'CARRITO_CANTIDAD', payload: { productoId: i.productoId, cantidad: i.cantidad + 1 } })}
                            aria-label="Agregar uno"
                            className="w-8 h-8 rounded-lg border border-tinta/20 hover:border-higo">+</button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <div className="p-5 space-y-4">
                  <Campo etiqueta="Nombre y apellido" valor={datos.nombre}
                         onChange={v => setDatos({ ...datos, nombre: v })} />
                  <Campo etiqueta="Mail" tipo="email" valor={datos.email}
                         onChange={v => setDatos({ ...datos, email: v })} />
                  <Campo etiqueta="Localidad y provincia" valor={datos.localidad}
                         onChange={v => setDatos({ ...datos, localidad: v })} />

                  <div>
                    <span className="eyebrow text-tinta-50 block mb-2">Cómo lo recibís</span>
                    <div className="space-y-2">
                      {s.metodosEnvio.map(m => {
                        const gratis = m.gratisDesde && subtotal >= m.gratisDesde
                        return (
                          <label key={m.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              datos.envioId === m.id ? 'border-higo bg-higo/5' : 'border-tinta/15 hover:border-tinta/30'}`}>
                            <input type="radio" name="envio" checked={datos.envioId === m.id}
                                   onChange={() => setDatos({ ...datos, envioId: m.id })} className="mt-1" />
                            <span className="flex-1 min-w-0">
                              <span className="text-sm block">{m.nombre}</span>
                              <span className="text-xs text-tinta-50 block mt-0.5">{m.plazo}</span>
                            </span>
                            <span className="cifra text-sm shrink-0">
                              {m.costo === 0 || gratis ? 'Gratis' : money(m.costo)}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {carrito.length > 0 && (
              <div className="border-t border-tinta/12 p-5 space-y-3">
                <div className="flex justify-between text-sm text-tinta-50">
                  <span>Frascos</span><span className="cifra">{money(subtotal)}</span>
                </div>
                {paso === 'datos' && (
                  <div className="flex justify-between text-sm text-tinta-50">
                    <span>Envío</span>
                    <span className="cifra">{costoEnvio === 0 ? 'Gratis' : money(costoEnvio)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-3 border-t border-tinta/10">
                  <span className="font-medium">Total</span>
                  <span className="cifra text-2xl font-semibold">{money(paso === 'datos' ? total : subtotal)}</span>
                </div>

                {paso === 'catalogo' ? (
                  <button onClick={() => setPaso('datos')}
                    className="btn w-full bg-higo text-papel py-3.5 rounded-lg font-semibold">
                    Continuar
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setPaso('catalogo')}
                      className="btn border border-tinta/20 px-4 py-3.5 rounded-lg text-sm hover:bg-papel-2">
                      Atrás
                    </button>
                    <button onClick={confirmarPedido}
                      disabled={!datos.nombre || !datos.email || !datos.localidad}
                      className="btn flex-1 bg-higo text-papel py-3.5 rounded-lg font-semibold disabled:opacity-35">
                      Confirmar el pedido
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Campo({ etiqueta, valor, onChange, tipo = 'text' }) {
  return (
    <label className="block">
      <span className="eyebrow text-tinta-50 block mb-1.5">{etiqueta}</span>
      <input type={tipo} value={valor} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg border border-tinta/20 bg-papel-2 focus:border-higo outline-none text-sm" />
    </label>
  )
}

/* Frasco dibujado: reemplazar por la foto real del producto cuando la haya. */
function Frasco({ color, agotado }) {
  return (
    <svg viewBox="0 0 120 150" className={`w-28 ${agotado ? 'opacity-30' : ''}`} aria-hidden="true">
      <rect x="42" y="8" width="36" height="10" rx="2" fill={color} opacity="0.85" />
      <path d="M34 22 h52 a6 6 0 0 1 6 6 v104 a8 8 0 0 1 -8 8 h-48 a8 8 0 0 1 -8 -8 v-104 a6 6 0 0 1 6 -6 z"
            fill="#FFFFFF" stroke={color} strokeWidth="2" opacity="0.9" />
      <path d="M34 48 h52 v84 a8 8 0 0 1 -8 8 h-36 a8 8 0 0 1 -8 -8 z" fill={color} opacity="0.75" />
      <rect x="44" y="70" width="32" height="26" rx="1" fill="#FFFFFF" opacity="0.92" />
      <line x1="49" y1="79" x2="71" y2="79" stroke={color} strokeWidth="1.5" opacity="0.6" />
      <line x1="49" y1="86" x2="65" y2="86" stroke={color} strokeWidth="1.5" opacity="0.4" />
    </svg>
  )
}
