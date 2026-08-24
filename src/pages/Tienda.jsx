import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { money, num } from '../lib/format'
import { descripcionesWeb } from '../lib/demoData'
import Firma from '../components/Firma'
import BarraDemo from '../components/BarraDemo'

/* ===========================================================================
   Tienda pública.

   Atiende dos clientes distintos con la misma página:

     · el que compra dos frascos para su casa
     · el revendedor que compra treinta para su dietética

   El interruptor de arriba cambia precios, unidad de venta y mínimo. No son
   dos tiendas separadas a propósito: el revendedor llega por el mismo link
   que le pasaron, y tiene que poder darse cuenta solo de que puede comprar
   al por mayor.
   =========================================================================== */

export default function Tienda() {
  const s = useStore()
  const [abierto, setAbierto] = useState(false)
  const [paso, setPaso] = useState('catalogo')
  const [datos, setDatos] = useState({
    nombre: '', email: '', localidad: '', negocio: '', cuit: '', envioId: 'me3',
  })
  const [confirmado, setConfirmado] = useState(null)

  const cond = s.condicionesMayorista
  const mayorista = s.modoTienda === 'mayorista'

  const stock = useMemo(() => {
    const m = {}
    s.stockWeb().forEach(w => { m[w.producto.id] = w.disponible })
    return m
  }, [s])

  const catalogo = s.productos.filter(p => p.visibleWeb)
  const carrito = s.carritoWeb
  const unidades = carrito.reduce((a, i) => a + i.cantidad, 0)
  const subtotal = carrito.reduce((a, i) => a + i.cantidad * i.precio, 0)

  // El revendedor no puede despachar menos del mínimo acordado.
  const faltanParaElMinimo = mayorista ? Math.max(cond.minimoFrascos - unidades, 0) : 0
  const alcanzaElMinimo = faltanParaElMinimo === 0

  const envio = s.metodosEnvio.find(m => m.id === datos.envioId)
  const umbralGratis = mayorista ? cond.envioGratisDesde : envio?.gratisDesde
  const costoEnvio = !envio ? 0
    : (envio.costo === 0 || (umbralGratis && subtotal >= umbralGratis) ? 0 : envio.costo)
  const total = subtotal + costoEnvio

  const datosCompletos = datos.nombre && datos.email && datos.localidad &&
    (!mayorista || (datos.negocio && datos.cuit))

  const cambiarModo = (modo) => {
    s.dispatch({ type: 'TIENDA_MODO', payload: { modo } })
    setPaso('catalogo')
    setConfirmado(null)
  }

  const confirmarPedido = () => {
    s.dispatch({ type: 'CREAR_PEDIDO', payload: {
      cliente: datos.nombre, email: datos.email, localidad: datos.localidad,
      canal: mayorista ? 'mayorista' : 'minorista',
      ...(mayorista ? { negocio: datos.negocio, cuit: datos.cuit } : {}),
      envio: costoEnvio, medio: 'transferencia',
      items: carrito.map(i => ({ productoId: i.productoId, cantidad: i.cantidad, precio: i.precio })),
    }})
    setConfirmado({ total, nombre: datos.nombre, mayorista })
    setPaso('catalogo')
    setAbierto(false)
  }

  const paso1 = mayorista ? cond.bulto : 1

  return (
    <div className="min-h-dvh bg-papel">
      <BarraDemo lado="tienda" />

      <header className="border-b border-tinta/12 sticky top-0 bg-papel/90 backdrop-blur z-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-24 flex items-center gap-4">
          <div className="flex items-center gap-3.5">
            <img src="/marca.png" alt="" width="64" height="64" className="w-14 h-14 sm:w-16 sm:h-16 shrink-0" />
            <div>
              <p className="text-xl font-bold tracking-tight leading-none">Cocina Antigua</p>
              <p className="text-xs text-tinta-50 mt-1.5">
                {mayorista ? 'Venta a revendedores' : 'Mermeladas de olla'}
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button onClick={() => setAbierto(true)}
              className="btn bg-higo text-papel px-5 py-2.5 rounded-xl text-sm">
              Carrito {unidades > 0 && <span className="cifra">({unidades})</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Interruptor de canal. Arriba de todo porque decide qué precios se
          ven en el resto de la página. */}
      <div className="border-b border-tinta/10 bg-papel-2/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="inline-flex p-1 rounded-xl bg-papel border border-tinta/12" role="group">
            <Interruptor activo={!mayorista} onClick={() => cambiarModo('minorista')}>
              Compro para mí
            </Interruptor>
            <Interruptor activo={mayorista} onClick={() => cambiarModo('mayorista')}>
              Soy revendedor
            </Interruptor>
          </div>
          <p className="text-sm text-tinta-50">
            {mayorista
              ? `Precio mayorista, ${Math.round(cond.descuento * 100)}% menos. Mínimo ${cond.minimoFrascos} frascos.`
              : `¿Tenés un negocio? Comprando ${cond.minimoFrascos} frascos o más pagás ${Math.round(cond.descuento * 100)}% menos.`}
          </p>
        </div>
      </div>

      {confirmado && (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-6">
          <div className="border border-laurel/40 bg-laurel/10 px-5 py-4 rounded-xl">
            <p className="text-lg font-semibold text-laurel">Listo, {confirmado.nombre}</p>
            <p className="text-sm text-tinta-50 mt-1">
              {confirmado.mayorista
                ? `Tu pedido mayorista por ${money(confirmado.total)} quedó registrado. Te mandamos la factura y los datos para transferir; lo preparamos apenas se acredite.`
                : `Tu pedido por ${money(confirmado.total)} quedó reservado. Te mandamos los datos para transferir por mail — tenés 48 horas antes de que se libere el stock.`}
            </p>
            <p className="mt-4 pt-4 border-t border-laurel/25 text-xs text-tinta-50">
              <span className="font-semibold uppercase tracking-[0.12em]">Sólo en la demostración</span>{' '}
              — <Link to="/pedidos" className="font-medium text-higo hover:underline underline-offset-4">
                mirá el pedido entrando al sistema →
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="halo border-b border-tinta/10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center entra">
          <img src="/marca.png" alt="Cocina Antigua" width="256" height="256"
               className="w-32 h-32 sm:w-44 sm:h-44 mx-auto" />

          {mayorista ? (
            <>
              <p className="eyebrow text-higo mt-8">Venta mayorista</p>
              <h1 className="display mt-5 mx-auto max-w-4xl text-balance">
                Poné nuestras mermeladas{' '}
                <span className="text-higo">en tu góndola</span>
              </h1>
              <p className="mt-7 mx-auto max-w-xl text-lg text-tinta-50 leading-relaxed text-balance">
                Trabajamos con dietéticas, delicatessen y almacenes de todo el país.
                Sin exclusividad, sin contrato y con reposición en el mes.
              </p>

              <dl className="mt-12 grid gap-6 sm:grid-cols-4 max-w-3xl mx-auto text-left sm:text-center">
                <Condicion valor={`${Math.round(cond.descuento * 100)}%`} texto="menos que el precio público" />
                <Condicion valor={num(cond.minimoFrascos)} texto="frascos de mínimo por pedido" />
                <Condicion valor={`x${cond.bulto}`} texto="frascos por bulto, un solo sabor" />
                <Condicion valor="Gratis" texto={`el envío desde ${money(cond.envioGratisDesde)}`} />
              </dl>
            </>
          ) : (
            <>
              <p className="eyebrow text-higo mt-8">Desde 2016 · Producción familiar</p>
              <h1 className="display mt-5 mx-auto max-w-4xl text-balance">
                Diez años cocinando en olla{' '}
                <span className="text-higo">y viajando con la olla</span>
              </h1>
              <p className="mt-7 mx-auto max-w-xl text-lg text-tinta-50 leading-relaxed text-balance">
                Nos vas a encontrar en la Fiesta del Poncho, en la Feria de las Colectividades,
                en Vendimia y en Expo Chaco. Si no llegás a ninguna, ahora te la mandamos a casa.
              </p>
            </>
          )}

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a href="#catalogo" className="btn bg-higo text-papel px-7 py-3.5 rounded-xl text-base">
              {mayorista ? 'Ver la lista de precios' : 'Ver los sabores'}
            </a>
            <button onClick={() => setAbierto(true)}
              className="btn bg-papel border border-tinta/15 px-7 py-3.5 rounded-xl text-base hover:bg-papel-2 hover:border-tinta/30">
              Mi pedido {unidades > 0 && <span className="cifra">({unidades})</span>}
            </button>
          </div>

          {!mayorista && (
            <div className="mt-14 pt-8 border-t border-tinta/10 flex flex-wrap justify-center gap-x-8 gap-y-3">
              {['Catamarca', 'Córdoba', 'Mendoza', 'Chaco', 'Neuquén', 'Buenos Aires'].map(p => (
                <span key={p} className="eyebrow text-tinta-50">{p}</span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Catálogo */}
      <section id="catalogo" className="mx-auto max-w-5xl px-4 sm:px-6 pt-20 pb-24 scroll-mt-24">
        <h2 className="display-2">{mayorista ? 'Lista de precios' : 'Lo que hay ahora'}</h2>
        <p className="text-tinta-50 mt-2 mb-10">
          {mayorista
            ? `Todos los precios son por frasco, sin IVA, y se venden de a bultos de ${cond.bulto} del mismo sabor.`
            : 'Cocinado en tandas chicas. Cuando se termina, se termina.'}
        </p>

        <div className="escalona grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {catalogo.map(p => {
            const queda = stock[p.id] ?? 0
            const precio = s.precioSegunModo(p)
            const enCarrito = carrito.find(i => i.productoId === p.id)?.cantidad ?? 0
            // Al por mayor hace falta al menos un bulto entero disponible.
            const agotado = mayorista ? queda < cond.bulto : queda === 0

            return (
              <article key={p.id} className="group flex flex-col">
                <div className="aspect-[4/5] rounded-2xl flex items-end justify-center overflow-hidden
                                transition-transform duration-300 group-hover:-translate-y-1.5"
                     style={{ background: `color-mix(in srgb, ${p.color} 10%, #F8FAFC)` }}>
                  <Frasco color={p.color} agotado={agotado} />
                </div>

                <div className="mt-4 flex-1 flex flex-col">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-lg font-semibold tracking-tight leading-tight">{p.nombre}</h3>
                    <span className="text-right shrink-0">
                      <span className="cifra text-lg font-semibold block">{money(precio)}</span>
                      {mayorista && (
                        <span className="cifra text-xs text-tinta-50 line-through block">
                          {money(p.precioWeb)}
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="eyebrow text-tinta-50 mt-1">
                    {p.presentacion} g{mayorista && ` · bulto de ${cond.bulto}`}
                  </p>
                  <p className="text-sm text-tinta-50 mt-2.5 leading-relaxed flex-1">
                    {descripcionesWeb[p.id]}
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    {enCarrito > 0 ? (
                      <div className="flex-1 flex items-center justify-between gap-2 border border-tinta/15 rounded-xl px-2 py-1.5">
                        <button
                          onClick={() => s.dispatch({ type: 'CARRITO_CANTIDAD', payload: { productoId: p.id, cantidad: enCarrito - paso1 } })}
                          aria-label={mayorista ? 'Quitar un bulto' : 'Quitar uno'}
                          className="w-8 h-8 rounded-lg hover:bg-papel-2">−</button>
                        <span className="text-sm text-center">
                          <span className="cifra font-semibold">{num(enCarrito)}</span>
                          <span className="text-tinta-50"> {enCarrito === 1 ? 'frasco' : 'frascos'}</span>
                        </span>
                        <button
                          disabled={enCarrito + paso1 > queda}
                          onClick={() => s.dispatch({ type: 'CARRITO_CANTIDAD', payload: { productoId: p.id, cantidad: enCarrito + paso1 } })}
                          aria-label={mayorista ? 'Agregar un bulto' : 'Agregar uno'}
                          className="w-8 h-8 rounded-lg hover:bg-papel-2 disabled:opacity-30 disabled:cursor-not-allowed">+</button>
                      </div>
                    ) : (
                      <button
                        disabled={agotado}
                        onClick={() => s.dispatch({ type: 'CARRITO_AGREGAR', payload: { productoId: p.id, cantidad: paso1, precio } })}
                        className="btn flex-1 bg-papel border border-tinta/20 py-2.5 rounded-xl text-sm hover:bg-papel-2 hover:border-tinta/35
                                   disabled:opacity-35 disabled:cursor-not-allowed">
                        {agotado ? 'Sin stock' : mayorista ? `Agregar bulto de ${cond.bulto}` : 'Agregar'}
                      </button>
                    )}
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

      {/* Barra de progreso hacia el mínimo: sólo aparece cuando hace falta */}
      {mayorista && unidades > 0 && !alcanzaElMinimo && (
        <div className="sticky bottom-0 z-10 border-t border-damasco/30 bg-damasco/10 backdrop-blur">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                Llevás {num(unidades)} de los {num(cond.minimoFrascos)} frascos del mínimo
              </p>
              <div className="h-2 bg-papel rounded-full overflow-hidden mt-2 max-w-md">
                <div className="h-full bg-damasco rounded-full transition-[width] duration-500"
                     style={{ width: `${(unidades / cond.minimoFrascos) * 100}%` }} />
              </div>
            </div>
            <p className="text-sm text-tinta-50">
              Falta{faltanParaElMinimo === 1 ? '' : 'n'} {num(faltanParaElMinimo)}
            </p>
          </div>
        </div>
      )}

      <footer className="border-t border-tinta/12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 grid gap-6 sm:grid-cols-3 text-sm text-tinta-50">
          <div>
            <p className="eyebrow text-tinta">Cómo se paga</p>
            <p className="mt-2 leading-relaxed">
              {mayorista
                ? 'Transferencia contra factura. La primera compra se paga por adelantado.'
                : 'Transferencia o Mercado Pago. Te reservamos el pedido 48 horas.'}
            </p>
          </div>
          <div>
            <p className="eyebrow text-tinta">Cómo llega</p>
            <p className="mt-2 leading-relaxed">
              {mayorista
                ? `Transporte a todo el país. El envío es gratis a partir de ${money(cond.envioGratisDesde)}.`
                : 'Correo Argentino a todo el país, o lo retirás en nuestro stand si venimos a tu feria.'}
            </p>
          </div>
          <div>
            <p className="eyebrow text-tinta">Dudas</p>
            <p className="mt-2 leading-relaxed">Escribinos por WhatsApp y te contestamos el mismo día.</p>
          </div>
        </div>
        <div className="border-t border-tinta/10">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 flex flex-wrap items-end justify-between gap-4">
            <p className="text-xs text-tinta-50">Cocina Antigua · Producción familiar desde 2016</p>
            <Firma />
          </div>
        </div>
      </footer>

      {/* Carrito lateral */}
      {abierto && (
        <div className="fixed inset-0 z-30 flex justify-end" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-tinta/40" onClick={() => setAbierto(false)} />
          <div className="relative w-full sm:max-w-md bg-papel border-l border-tinta/15 flex flex-col">
            <div className="px-5 py-4 border-b border-tinta/12 flex items-center justify-between">
              <span className="text-lg font-semibold tracking-tight">
                {paso === 'catalogo' ? 'Tu pedido' : 'Tus datos'}
                {mayorista && <span className="ml-2 text-xs font-medium text-higo align-middle">MAYORISTA</span>}
              </span>
              <button onClick={() => setAbierto(false)} className="text-sm font-medium text-tinta-50 hover:text-higo">
                Cerrar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {carrito.length === 0 ? (
                <p className="p-10 text-center text-sm text-tinta-50">
                  Todavía no elegiste nada. Volvé al catálogo y agregá
                  {mayorista ? ' algún bulto.' : ' algún frasco.'}
                </p>
              ) : paso === 'catalogo' ? (
                <>
                  {mayorista && !alcanzaElMinimo && (
                    <p className="m-4 p-3 rounded-xl bg-damasco/10 text-sm text-damasco">
                      Te falta{faltanParaElMinimo === 1 ? '' : 'n'} {num(faltanParaElMinimo)} frasco
                      {faltanParaElMinimo === 1 ? '' : 's'} para llegar al mínimo de {num(cond.minimoFrascos)}.
                    </p>
                  )}
                  <ul className="divide-y divide-tinta/8">
                    {carrito.map(i => {
                      const p = s.producto(i.productoId)
                      return (
                        <li key={i.productoId} className="p-4 flex items-center gap-3">
                          <span className="w-1.5 h-10 rounded-full shrink-0" style={{ background: p.color }} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm truncate">{p.nombre}</p>
                            <p className="cifra text-xs text-tinta-50 mt-0.5">
                              {money(i.precio)} c/u
                              {mayorista && ` · ${num(i.cantidad / cond.bulto)} ${i.cantidad === cond.bulto ? 'bulto' : 'bultos'}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => s.dispatch({ type: 'CARRITO_CANTIDAD', payload: { productoId: i.productoId, cantidad: i.cantidad - paso1 } })}
                              aria-label="Quitar"
                              className="w-8 h-8 rounded-lg border border-tinta/20 hover:border-higo">−</button>
                            <span className="cifra w-8 text-center text-sm">{i.cantidad}</span>
                            <button onClick={() => s.dispatch({ type: 'CARRITO_CANTIDAD', payload: { productoId: i.productoId, cantidad: i.cantidad + paso1 } })}
                              aria-label="Agregar"
                              className="w-8 h-8 rounded-lg border border-tinta/20 hover:border-higo">+</button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </>
              ) : (
                <div className="p-5 space-y-4">
                  {mayorista && (
                    <>
                      <Campo etiqueta="Razón social o nombre del negocio" valor={datos.negocio}
                             onChange={v => setDatos({ ...datos, negocio: v })} />
                      <Campo etiqueta="CUIT" valor={datos.cuit}
                             onChange={v => setDatos({ ...datos, cuit: v })} />
                    </>
                  )}
                  <Campo etiqueta={mayorista ? 'Persona de contacto' : 'Nombre y apellido'} valor={datos.nombre}
                         onChange={v => setDatos({ ...datos, nombre: v })} />
                  <Campo etiqueta="Mail" tipo="email" valor={datos.email}
                         onChange={v => setDatos({ ...datos, email: v })} />
                  <Campo etiqueta="Localidad y provincia" valor={datos.localidad}
                         onChange={v => setDatos({ ...datos, localidad: v })} />

                  <div>
                    <span className="eyebrow text-tinta-50 block mb-2">Cómo lo recibís</span>
                    <div className="space-y-2">
                      {s.metodosEnvio.map(m => {
                        const umbral = mayorista ? cond.envioGratisDesde : m.gratisDesde
                        const gratis = m.costo === 0 || (umbral && subtotal >= umbral)
                        return (
                          <label key={m.id}
                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                              datos.envioId === m.id ? 'border-higo bg-higo/5' : 'border-tinta/15 hover:border-tinta/30'}`}>
                            <input type="radio" name="envio" checked={datos.envioId === m.id}
                                   onChange={() => setDatos({ ...datos, envioId: m.id })} className="mt-1" />
                            <span className="flex-1 min-w-0">
                              <span className="text-sm block">{m.nombre}</span>
                              <span className="text-xs text-tinta-50 block mt-0.5">{m.plazo}</span>
                            </span>
                            <span className="cifra text-sm shrink-0">
                              {gratis ? 'Gratis' : money(m.costo)}
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
                  <span>{num(unidades)} frascos</span><span className="cifra">{money(subtotal)}</span>
                </div>
                {paso === 'datos' && (
                  <div className="flex justify-between text-sm text-tinta-50">
                    <span>Envío</span>
                    <span className="cifra">{costoEnvio === 0 ? 'Gratis' : money(costoEnvio)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-3 border-t border-tinta/10">
                  <span className="font-medium">Total</span>
                  <span className="cifra text-2xl font-bold">{money(paso === 'datos' ? total : subtotal)}</span>
                </div>

                {paso === 'catalogo' ? (
                  <button onClick={() => setPaso('datos')}
                    disabled={!alcanzaElMinimo}
                    className="btn w-full bg-higo text-papel py-3.5 rounded-xl font-semibold disabled:opacity-35 disabled:cursor-not-allowed">
                    {alcanzaElMinimo
                      ? 'Continuar'
                      : `Faltan ${num(faltanParaElMinimo)} frascos para el mínimo`}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setPaso('catalogo')}
                      className="btn bg-papel border border-tinta/20 px-4 py-3.5 rounded-xl text-sm hover:bg-papel-2">
                      Atrás
                    </button>
                    <button onClick={confirmarPedido}
                      disabled={!datosCompletos}
                      className="btn flex-1 bg-higo text-papel py-3.5 rounded-xl font-semibold disabled:opacity-35">
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

function Interruptor({ activo, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={activo}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        activo ? 'bg-higo text-papel' : 'text-tinta-50 hover:text-tinta'}`}
    >
      {children}
    </button>
  )
}

function Condicion({ valor, texto }) {
  return (
    <div>
      <dt className="cifra text-3xl font-bold text-higo">{valor}</dt>
      <dd className="text-sm text-tinta-50 mt-1 leading-snug">{texto}</dd>
    </div>
  )
}

function Campo({ etiqueta, valor, onChange, tipo = 'text' }) {
  return (
    <label className="block">
      <span className="eyebrow text-tinta-50 block mb-1.5">{etiqueta}</span>
      <input type={tipo} value={valor} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border border-tinta/20 bg-papel-2 focus:border-higo outline-none text-sm" />
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
